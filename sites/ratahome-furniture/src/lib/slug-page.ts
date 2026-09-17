import type { Locale } from '@trade/core/i18n/config';
import { getContent } from './content';
import { collectionSlugs, joinerySlugs, projectSlugs, pageSlugs } from '../data/slugs';

export function getSlugStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: Record<string, unknown> }> = [];

  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of collectionSlugs) {
    paths.push({ params: { slug: `collections/${slug}` }, props: { type: 'collection', slug } });
  }
  for (const slug of joinerySlugs) {
    paths.push({ params: { slug: `joinery/${slug}` }, props: { type: 'joinery', slug } });
  }
  for (const slug of projectSlugs) {
    paths.push({ params: { slug: `projects/${slug}` }, props: { type: 'project', slug } });
  }

  return paths;
}

function titleize(s: string) {
  return s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function resolveSlugPage(
  locale: Locale,
  type: string,
  slug: string
) {
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
  } else if (type === 'collection') {
    title = titleize(slug);
    description =
      locale === 'zh'
        ? `探索我们的${slug.replace(/-/g, ' ')}系列。`
        : `Explore our ${slug.replace(/-/g, ' ')} collection.`;
    content =
      locale === 'zh'
        ? `浏览精选${slug.replace(/-/g, ' ')}产品，与全屋配置套餐协调搭配。`
        : `Browse curated ${slug.replace(/-/g, ' ')} pieces selected to coordinate with whole-home furnishing packages.`;
    showCollectionBenefits = true;
    ctaKey = 'requestQuote';
  } else if (type === 'joinery') {
    title = titleize(slug);
    description =
      locale === 'zh'
        ? `定制${slug.replace(/-/g, ' ')}方案。`
        : `Custom ${slug.replace(/-/g, ' ')} solutions.`;
    content =
      locale === 'zh'
        ? `我们的木作团队制造定制${slug.replace(/-/g, ' ')}，与您的家具选型匹配。`
        : `Our joinery team manufactures custom ${slug.replace(/-/g, ' ')} to match your furniture selections.`;
    ctaKey = 'discussJoinery';
  } else {
    title = titleize(slug);
    description =
      locale === 'zh'
        ? `项目案例：${slug.replace(/-/g, ' ')}。`
        : `Project case study: ${slug.replace(/-/g, ' ')}.`;
    content =
      locale === 'zh'
        ? `了解我们如何为这个${slug.replace(/-/g, ' ')}项目交付完整配置方案。`
        : `Explore how we delivered a complete furnishing solution for this ${slug.replace(/-/g, ' ')} project.`;
    ctaKey = 'startProject';
  }

  return { title, description, content, showCollectionBenefits, ctaKey };
}
