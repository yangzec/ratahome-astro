export const siteConfig = {
  siteId: 'ratahome-furniture',
  name: 'Ratahome Furniture',
  template: 'b2b-manufacturing',
  defaultLocale: 'en' as const,
  locales: ['en', 'zh'] as const,
};

export type SiteConfig = typeof siteConfig;
