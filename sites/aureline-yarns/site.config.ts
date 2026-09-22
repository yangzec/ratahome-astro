export const siteConfig = {
  siteId: 'aureline-yarns',
  name: 'Aureline Yarns',
  template: 'b2b-manufacturing',
  defaultLocale: 'en' as const,
  locales: ['en', 'zh'] as const,
};

export type SiteConfig = typeof siteConfig;
