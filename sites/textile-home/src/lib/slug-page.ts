import type { Locale } from '@trade/core/i18n/config';
import { getContent } from './content';
import { pageSlugs, productSlugs } from '../data/slugs';

export function getSlugStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: Record<string, unknown> }> = [];

  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of productSlugs) {
    paths.push({ params: { slug: `products/${slug}` }, props: { type: 'product', slug } });
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
  } else if (type === 'product') {
    title = titleize(slug);
    description =
      locale === 'zh'
        ? `${slug.replace(/-/g, ' ')} 家纺套装、认证与定制说明。`
        : `Programs, certifications and customization for ${slug.replace(/-/g, ' ')}.`;
    content =
      locale === 'zh'
        ? `我们提供 ${slug.replace(/-/g, ' ')} 系列开发——面料认证、绣花定制与出口包装。提交参考款或规格表，48 小时内回复 MOQ 与打样计划。`
        : `We develop ${slug.replace(/-/g, ' ')} programs with certified materials, embroidery options and export packing. Share a reference or spec sheet — MOQ and sampling plan within 48 hours.`;
    ctaKey = 'requestQuote';
  } else {
    title = titleize(slug);
    description = '';
    content = '';
  }

  return { title, description, content, showCollectionBenefits, ctaKey };
}
