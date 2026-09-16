import type { Locale } from '../i18n/config';
import { defaultLocale } from '../i18n/config';

import enCommon from '../content/en/common.json';
import enHome from '../content/en/home.json';
import enNav from '../content/en/navigation.json';
import enPages from '../content/en/pages.json';

import zhCommon from '../content/zh/common.json';
import zhHome from '../content/zh/home.json';
import zhNav from '../content/zh/navigation.json';
import zhPages from '../content/zh/pages.json';

export type SiteContent = {
  common: typeof enCommon;
  home: typeof enHome;
  navigation: typeof enNav;
  pages: typeof enPages;
};

const contentMap: Record<Locale, SiteContent> = {
  en: { common: enCommon, home: enHome, navigation: enNav, pages: enPages },
  zh: { common: zhCommon, home: zhHome, navigation: zhNav, pages: zhPages },
};

export function getContent(locale: Locale): SiteContent {
  return contentMap[locale] ?? contentMap[defaultLocale];
}
