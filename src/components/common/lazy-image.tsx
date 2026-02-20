'use client';

import { ImgHTMLAttributes } from 'react';
import { useOptimizeSettings } from '@/hooks/use-optimize-settings';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

/**
 * Drop-in replacement for <img> that respects the
 * optimize.lazy_loading setting from the database.
 * Defaults to lazy loading when the setting can't be read.
 */
export function LazyImage({ src, alt, loading, ...props }: LazyImageProps) {
  const { settings } = useOptimizeSettings();

  // Caller can override loading explicitly; otherwise follow the setting
  const resolvedLoading = loading ?? (settings.lazyLoading ? 'lazy' : undefined);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading={resolvedLoading} {...props} />
  );
}
