'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TranslationMap } from '@/types';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, defaultValueOrVariables?: string | Record<string, string | number>, variables?: Record<string, string | number>) => string;
  translations: TranslationMap;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'preferred_language';
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

  // Initialize language from localStorage
  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) {
      setLanguageState(storedLanguage);
    }
    setIsInitialized(true);
  }, []);

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
    staleTime: 0, // Always consider data stale
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Set language and force refetch
  const setLanguage = useCallback((lang: string) => {
    if (lang === language) return; // No change needed

    console.log('[Translation] Switching language:', language, '→', lang);

    // Update state
    setLanguageState(lang);

    // Persist to localStorage
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

    // Invalidate cache to force refetch for new language
    queryClient.invalidateQueries({ queryKey: ['translations', lang] });
  }, [language, queryClient]);

  // Report missing key to backend (non-blocking)
  const reportMissingKey = useCallback((key: string, defaultValue?: string) => {
    // Skip if already reported in this session
    if (reportedKeysRef.current.has(key)) return;

    // Mark as reported
    reportedKeysRef.current.add(key);

    // Get current page URL
    const pageUrl = typeof window !== 'undefined' ? window.location.pathname : '';

    // Report asynchronously (fire and forget - don't block rendering)
    apiClient.post('/translations/report-missing', {
      key,
      default_value: defaultValue || key,
      page_url: pageUrl,
    }).catch(() => {
      // Silently ignore errors - don't disrupt the app
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Translation] Missing key reported:', key);
    }
  }, []);

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
    if (!translationExists && isInitialized && !isLoading && Object.keys(translations).length > 0) {
      reportMissingKey(key, defaultValue);
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
    t,
    translations,
    isLoading: !isInitialized || isLoading || isFetching,
  }), [language, setLanguage, t, translations, isInitialized, isLoading, isFetching]);

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