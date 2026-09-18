import type { Locale } from '@trade/core/i18n/config';
import { getContent } from './content';
import { pageSlugs, styleSlugs } from '../data/slugs';

export function getSlugStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: Record<string, unknown> }> = [];

  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of styleSlugs) {
    paths.push({ params: { slug: `styles/${slug}` }, props: { type: 'style', slug } });
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
  } else if (type === 'style') {
    title = titleize(slug);
    description =
      locale === 'zh'
        ? `${slug.replace(/-/g, ' ')} 成衣系列开发、尺码与打样说明。`
        : `Development, sizing and sampling for ${slug.replace(/-/g, ' ')} programs.`;
    content =
      locale === 'zh'
        ? `我们提供 ${slug.replace(/-/g, ' ')} 系列的版型开发、尺寸表、面料搭配与打样流程。提交参考款或设计稿后，48 小时内回复开发周期与 MOQ。`
        : `We develop ${slug.replace(/-/g, ' ')} programs — blocks, size specs, fabric pairing and sampling. Share a reference style or tech pack; we reply within 48 hours with development timeline and MOQ.`;
    ctaKey = 'requestQuote';
  } else {
    title = titleize(slug);
    description = '';
    content = '';
  }

  return { title, description, content, showCollectionBenefits, ctaKey };
}
