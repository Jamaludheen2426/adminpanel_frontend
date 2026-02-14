'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import type { TranslationMap } from '@/types';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  applyLanguage: (lang: string) => void;
  t: (key: string, defaultValueOrVariables?: string | Record<string, string | number>, variables?: Record<string, string | number>) => string;
  translations: TranslationMap;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const DEFAULT_LANGUAGE = 'en';

interface TranslationProviderProps {
  children: React.ReactNode;
  defaultLanguage?: string;
}

export function TranslationProvider({
  children,
  defaultLanguage = DEFAULT_LANGUAGE
}: TranslationProviderProps) {
  const [language, setLanguageState] = useState<string>(defaultLanguage);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Track reported missing keys to avoid duplicate reports in the same session
  const reportedKeysRef = useRef<Set<string>>(new Set());
  // Batch missing key reports to reduce API calls
  const pendingReportsRef = useRef<Array<{ key: string; default_value: string; page_url: string }>>([]);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch public settings to get the language preference
  const { data: publicSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: queryKeys.settings.public(),
    queryFn: async () => {
      const response = await apiClient.get('/settings/public');
      return response.data.data.settings as Record<string, string>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Mutation to update language setting
  const updateLanguageMutation = useMutation({
    mutationFn: async (lang: string) => {
      await apiClient.put('/settings/language', { value: lang });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
    onError: (error) => {
      console.error('[Translation] Failed to save language preference:', error);
    },
  });

  // Initialize language from public settings
  useEffect(() => {
    if (publicSettings?.language) {
      setLanguageState(publicSettings.language);
    }
    if (!isLoadingSettings) {
      setIsInitialized(true);
    }
  }, [publicSettings, isLoadingSettings]);

  // Fetch translations with forced refetch on language change
  const { data: translations = {}, isLoading, isFetching } = useQuery({
    queryKey: ['translations', language],
    queryFn: async () => {
      console.log('[Translation] Fetching translations for language:', language);
      const response = await apiClient.get(`/translations/${language}`);
      // Extract translations from API response: { success: true, data: { translations: {...} } }
      const translationData = response.data?.data?.translations || {};
      console.log('[Translation] Received', Object.keys(translationData).length, 'keys for', language);
      return translationData as TranslationMap;
    },
    enabled: isInitialized && !!language,
    staleTime: 10 * 60 * 1000, // 10 minutes - translations rarely change
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Apply language without saving to settings (used when settings are saved separately)
  const applyLanguage = useCallback((lang: string) => {
    if (lang === language) return; // No change needed

    console.log('[Translation] Applying language:', language, '→', lang);

    // Update state
    setLanguageState(lang);

    // Invalidate cache to force refetch for new language
    queryClient.invalidateQueries({ queryKey: ['translations', lang] });
  }, [language, queryClient]);

  // Set language and save to settings API
  const setLanguage = useCallback((lang: string) => {
    if (lang === language) return; // No change needed

    console.log('[Translation] Switching language:', language, '→', lang);

    // Update state immediately for responsive UI
    setLanguageState(lang);

    // Invalidate cache to force refetch for new language
    queryClient.invalidateQueries({ queryKey: ['translations', lang] });

    // Save to settings API
    updateLanguageMutation.mutate(lang);
  }, [language, queryClient, updateLanguageMutation]);

  // Flush batched missing key reports to backend
  const flushMissingKeys = useCallback(() => {
    const batch = pendingReportsRef.current;
    if (batch.length === 0) return;

    // Clear the batch
    pendingReportsRef.current = [];
    batchTimerRef.current = null;

    // Send all at once (fire and forget)
    Promise.all(
      batch.map((report) =>
        apiClient.post('/translations/report-missing', report).catch(() => {})
      )
    ).then(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Translation] Batch reported', batch.length, 'missing keys');
      }
    });
  }, []);

  // Report missing key to backend (batched, non-blocking)
  const reportMissingKey = useCallback((key: string, defaultValue?: string) => {
    // Skip if already reported in this session
    if (reportedKeysRef.current.has(key)) return;

    // Mark as reported
    reportedKeysRef.current.add(key);

    // Get current page URL
    const pageUrl = typeof window !== 'undefined' ? window.location.pathname : '';

    // Add to batch
    pendingReportsRef.current.push({
      key,
      default_value: defaultValue || key,
      page_url: pageUrl,
    });

    // Debounce: flush after 5 seconds of no new missing keys
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }
    batchTimerRef.current = setTimeout(flushMissingKeys, 5000);
  }, [flushMissingKeys]);

  // Translation function with variable interpolation and missing key detection
  const t = useCallback((
    key: string,
    defaultValueOrVariables?: string | Record<string, string | number>,
    variables?: Record<string, string | number>
  ): string => {
    // Parse arguments - second param can be default value (string) or variables (object)
    let defaultValue: string | undefined;
    let vars: Record<string, string | number> | undefined;

    if (typeof defaultValueOrVariables === 'string') {
      defaultValue = defaultValueOrVariables;
      vars = variables;
    } else {
      vars = defaultValueOrVariables;
    }

    // Check if translation exists
    const translationExists = key in translations;
    let text = translationExists ? translations[key] : (defaultValue || key);

    // Report missing key if not found (only after translations are loaded)
    if (!translationExists) {
      if (isInitialized && !isLoading && Object.keys(translations).length > 0) {
        reportMissingKey(key, defaultValue);
      } else if (process.env.NODE_ENV === 'development') {
        // Debug: log why missing key wasn't reported
        console.log('[Translation] Key not found but not reporting:', key, {
          isInitialized,
          isLoading,
          translationsCount: Object.keys(translations).length
        });
      }
    }

    // Variable interpolation: {name} -> value
    if (vars) {
      Object.entries(vars).forEach(([varKey, value]) => {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(value));
      });
    }

    return text;
  }, [translations, isInitialized, isLoading, reportMissingKey]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    applyLanguage,
    t,
    translations,
    isLoading: !isInitialized || isLoading || isFetching,
  }), [language, setLanguage, applyLanguage, t, translations, isInitialized, isLoading, isFetching]);

  // Debug: Log when translations are loaded
  useEffect(() => {
    if (isInitialized && !isLoading && !isFetching) {
      console.log('[Translation] Ready:', language, '|', Object.keys(translations).length, 'keys');
    }
  }, [language, translations, isLoading, isFetching, isInitialized]);

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
}

export { TranslationContext };