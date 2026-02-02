import { useTranslationContext } from '@/providers/translation-provider';

/**
 * Hook to access translation functions and current language
 *
 * @example
 * ```tsx
 * const { t, language, setLanguage } = useTranslation();
 *
 * // Basic usage
 * <Button>{t('common.save')}</Button>
 *
 * // With default value (auto-reports missing key if not found)
 * <Button>{t('common.submit', 'Submit')}</Button>
 *
 * // With variables
 * <p>{t('auth.welcome', { name: user.name })}</p>
 * // "Welcome, {name}!" -> "Welcome, John!"
 *
 * // With default value AND variables
 * <p>{t('auth.greeting', 'Hello, {name}!', { name: user.name })}</p>
 *
 * // Change language
 * <Select onValueChange={setLanguage} value={language}>
 *   <SelectItem value="en">English</SelectItem>
 *   <SelectItem value="ta">Tamil</SelectItem>
 *   <SelectItem value="hi">Hindi</SelectItem>
 * </Select>
 * ```
 *
 * Missing keys are automatically detected and reported to the backend
 * for admin review. This is non-blocking and won't slow down the app.
 */
export function useTranslation() {
  const { t, language, setLanguage, isLoading, translations } = useTranslationContext();

  return {
    /**
     * Translate a key to the current language
     * @param key - The translation key (e.g., 'common.save')
     * @param defaultValueOrVariables - Optional default value (string) or variables (object)
     * @param variables - Optional variables when default value is provided
     * @returns The translated string, default value, or key if not found
     *
     * Missing keys are auto-reported to /translations/report-missing
     */
    t,

    /**
     * Current language code (e.g., 'en', 'ta', 'hi')
     */
    language,

    /**
     * Change the current language
     * @param lang - Language code to switch to
     */
    setLanguage,

    /**
     * Whether translations are currently loading
     */
    isLoading,

    /**
     * Full translation map (for advanced use cases)
     */
    translations,
  };
}

export default useTranslation;
