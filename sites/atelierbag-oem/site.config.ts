export const siteConfig = {
  siteId: 'atelierbag-oem',
  name: 'AtelierBag OEM',
  template: 'b2b-manufacturing',
  defaultLocale: 'en' as const,
  locales: ['en', 'zh'] as const,
};

export type SiteConfig = typeof siteConfig;
