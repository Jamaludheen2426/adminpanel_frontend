import { useSettingsByGroup } from './use-settings';

interface OptimizeSettings {
  imageCompression: boolean;
  imageQuality: number;
  lazyLoading: boolean;
  logRetentionDays: number;
}

/**
 * Returns parsed optimize settings from the DB.
 * Use this anywhere you need to read image/lazy-loading/pagination config.
 */
export function useOptimizeSettings(): { settings: OptimizeSettings; isLoading: boolean } {
  const { data, isLoading } = useSettingsByGroup('optimize');

  const map: Record<string, string> = {};
  data?.forEach(s => { map[s.key] = s.value || ''; });

  return {
    isLoading,
    settings: {
      imageCompression: map['optimize.image_compression'] === '1',
      imageQuality: parseInt(map['optimize.image_quality'] || '80'),
      lazyLoading: map['optimize.lazy_loading'] !== '0', // default true
      logRetentionDays: parseInt(map['optimize.log_retention_days'] || '90'),
    },
  };
}
