import type { Locale } from '@trade/core/i18n/config';
import { getContent } from './content';
import { catalogSlugs, pageSlugs } from '../data/slugs';

export function getSlugStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: Record<string, unknown> }> = [];

  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of catalogSlugs) {
    paths.push({ params: { slug: `products/${slug}` }, props: { type: 'catalog', slug } });
  }

  return paths;
}

function titleize(s: string) {
  return s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function resolveSlugPage(locale: Locale, type: string, slug: string) {
  const { pages } = getContent(locale);

  let title: string;
  let description: string;
  let content: string;
  let showCollectionBenefits = false;
  let ctaKey: 'requestQuote' | 'startProject' = 'startProject';

  if (type === 'page') {
    const page = pages.slugs[slug as keyof typeof pages.slugs];
    title = page?.title ?? titleize(slug);
    description = page?.description ?? '';
    content = page?.content ?? '';
  } else if (type === 'catalog') {
    title = titleize(slug);
    description = '';
    content = '';
    ctaKey = 'requestQuote';
  } else {
    title = titleize(slug);
    description = '';
    content = '';
  }

  return { title, description, content, showCollectionBenefits, ctaKey };
}
