import type { Locale } from './config';
import { defaultLocale } from './config';

/** Build a locale-aware path. English has no prefix. */
export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return normalized;
  if (normalized === '/') return `/${locale}`;
  return `/${locale}${normalized}`;
}

/** Switch locale while preserving the current path. */
export function switchLocalePath(currentPath: string, targetLocale: Locale): string {
  const stripped = currentPath.replace(/^\/(en|zh)(?=\/|$)/, '') || '/';
  return localizedPath(stripped, targetLocale);
}

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/zh')) return 'zh';
  return defaultLocale;
}
