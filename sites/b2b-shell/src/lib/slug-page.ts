import type { Locale } from '@trade/core/i18n/config';
import { getContent } from './content';
import { collectionSlugs, joinerySlugs, projectSlugs, pageSlugs } from '../data/slugs';

export type PageSpec = { parameter: string; value: string };
export type PageRelated = { label: string; href: string };
export type PageSection = { title: string; body: string; items?: string[] };

export type ResolvedSlugPage = {
  title: string;
  description: string;
  content: string;
  showCollectionBenefits: boolean;
  ctaKey: 'requestQuote' | 'discussJoinery' | 'startProject';
  bullets?: string[];
  specs?: PageSpec[];
  applicationsTitle?: string;
  applicationsIntro?: string;
  applications?: string[];
  applicationsNote?: string;
  qcTitle?: string;
  qc?: string;
  moqTitle?: string;
  moq?: string;
  ctaTitle?: string;
  ctaBody?: string;
  related?: PageRelated[];
  sections?: PageSection[];
};

type SlugEntry = {
  title?: string;
  description?: string;
  content?: string;
  bullets?: string[];
  specs?: PageSpec[];
  applicationsTitle?: string;
  applicationsIntro?: string;
  applications?: string[];
  applicationsNote?: string;
  qcTitle?: string;
  qc?: string;
  moqTitle?: string;
  moq?: string;
  ctaTitle?: string;
  ctaBody?: string;
  related?: PageRelated[];
  sections?: PageSection[];
};

export function getSlugStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: Record<string, unknown> }> = [];

  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of collectionSlugs) {
    paths.push({ params: { slug: `collections/${slug}` }, props: { type: 'collection', slug } });
    paths.push({ params: { slug: `products/${slug}` }, props: { type: 'collection', slug } });
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

function findSlugEntry(pages: { slugs: Record<string, SlugEntry> }, slug: string): SlugEntry | undefined {
  return pages.slugs[slug]
    ?? pages.slugs[`products/${slug}`]
    ?? pages.slugs[slug.replace(/^products\//, '')];
}

function extrasFrom(page?: SlugEntry): Partial<ResolvedSlugPage> {
  if (!page) return {};
  return {
    bullets: page.bullets,
    specs: page.specs,
    applicationsTitle: page.applicationsTitle,
    applicationsIntro: page.applicationsIntro,
    applications: page.applications,
    applicationsNote: page.applicationsNote,
    qcTitle: page.qcTitle,
    qc: page.qc,
    moqTitle: page.moqTitle,
    moq: page.moq,
    ctaTitle: page.ctaTitle,
    ctaBody: page.ctaBody,
    related: page.related,
    sections: page.sections,
  };
}

export function resolveSlugPage(
  locale: Locale,
  type: string,
  slug: string
): ResolvedSlugPage {
  const { pages } = getContent(locale);
  const page = findSlugEntry(pages, slug);

  let title: string;
  let description: string;
  let content: string;
  let showCollectionBenefits = false;
  let ctaKey: 'requestQuote' | 'discussJoinery' | 'startProject' = 'startProject';

  if (type === 'page') {
    title = page?.title ?? titleize(slug);
    description = page?.description ?? '';
    content = page?.content ?? '';
  } else if (type === 'collection') {
    title = page?.title ?? titleize(slug);
    description =
      page?.description
      ?? (locale === 'zh'
        ? `查看 ${title} 的规格、用途与询价方式。`
        : `Explore specs, finishes, and typical end uses for ${title}.`);
    content =
      page?.content
      ?? (locale === 'zh'
        ? `浏览 ${title} 的工艺要点，然后询价或索样。`
        : `Review construction notes for ${title}, then request a quote or sample.`);
    showCollectionBenefits = !page?.specs && !page?.bullets;
    ctaKey = 'requestQuote';
  } else if (type === 'joinery') {
    title = page?.title ?? titleize(slug);
    description = page?.description ?? '';
    content = page?.content ?? '';
    ctaKey = 'discussJoinery';
  } else {
    title = page?.title ?? titleize(slug);
    description = page?.description ?? '';
    content = page?.content ?? '';
    ctaKey = 'startProject';
  }

  return {
    title,
    description,
    content,
    showCollectionBenefits,
    ctaKey,
    ...extrasFrom(page),
  };
}
