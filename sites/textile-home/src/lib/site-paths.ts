import type { Locale } from '@trade/core/i18n/config';
import { defaultLocale, locales } from '@trade/core/i18n/config';
import { getSlugStaticPaths } from './slug-page';

type FixedKind = 'about' | 'contact';

const fixedRoutes: Array<{ slug: string; kind: FixedKind }> = [
  { slug: 'about', kind: 'about' },
  { slug: 'contact', kind: 'contact' },
];

function localizedSlug(slug: string, locale: Locale): string | undefined {
  if (!slug) {
    return locale === defaultLocale ? undefined : locale;
  }
  return locale === defaultLocale ? slug : `${locale}/${slug}`;
}

export function getSiteStaticPaths() {
  const paths: Array<{
    params: { slug?: string };
    props: Record<string, unknown>;
  }> = [];

  for (const { slug, kind } of fixedRoutes) {
    for (const locale of locales) {
      const pathSlug = localizedSlug(slug, locale);
      paths.push({
        params: pathSlug ? { slug: pathSlug } : {},
        props: { locale, kind },
      });
    }
  }

  for (const entry of getSlugStaticPaths()) {
    for (const locale of locales) {
      const pathSlug = localizedSlug(entry.params.slug, locale);
      if (!pathSlug) continue;
      paths.push({
        params: { slug: pathSlug },
        props: { locale, kind: 'slug', ...entry.props },
      });
    }
  }

  return paths;
}
