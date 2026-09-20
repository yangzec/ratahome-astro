export const siteConfig = {
  siteId: 'chromora-yarns',
  name: 'Chromora Yarns',
  template: 'b2b-manufacturing',
  defaultLocale: 'en' as const,
  locales: ['en', 'zh'] as const,
};

export type SiteConfig = typeof siteConfig;
