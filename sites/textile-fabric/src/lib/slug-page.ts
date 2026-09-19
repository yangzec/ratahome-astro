import type { Locale } from '@trade/core/i18n/config';
import { getContent } from './content';
import { fabricSlugs, pageSlugs } from '../data/slugs';

export function getSlugStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: Record<string, unknown> }> = [];

  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of fabricSlugs) {
    paths.push({ params: { slug: `fabrics/${slug}` }, props: { type: 'fabric', slug } });
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
  let ctaKey: 'requestQuote' | 'discussJoinery' | 'startProject' = 'startProject';

  if (type === 'page') {
    const page = pages.slugs[slug as keyof typeof pages.slugs];
    title = page?.title ?? titleize(slug);
    description = page?.description ?? '';
    content = page?.content ?? '';
  } else if (type === 'fabric') {
    title = titleize(slug);
    description =
      locale === 'zh'
        ? `${slug.replace(/-/g, ' ')} 面料规格、克重与 MOQ 说明。`
        : `Specifications, weight range and MOQ for ${slug.replace(/-/g, ' ')} fabrics.`;
    content =
      locale === 'zh'
        ? `我们提供 ${slug.replace(/-/g, ' ')} 系列现货与定制开发。提交规格表或参考样布后，48 小时内回复可用成分、克重区间、色卡与起订量。`
        : `We supply ${slug.replace(/-/g, ' ')} programs from stock and custom development. Share a spec sheet or reference swatch — we reply within 48 hours with composition, weight range, lab dips and MOQ.`;
    ctaKey = 'requestQuote';
  } else {
    title = titleize(slug);
    description = '';
    content = '';
  }

  return { title, description, content, showCollectionBenefits, ctaKey };
}
