export const siteConfig = {
  siteId: 'b2b-shell',
  name: 'B2B Shell',
  template: 'b2b-manufacturing',
  defaultLocale: 'en' as const,
  locales: ['en', 'zh'] as const,
};

export type SiteConfig = typeof siteConfig;
