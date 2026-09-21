export const siteConfig = {
  siteId: 'loftknit-oem',
  name: 'LoftKnit',
  template: 'b2b-manufacturing',
  defaultLocale: 'en' as const,
  locales: ['en', 'zh'] as const,
};

export type SiteConfig = typeof siteConfig;
