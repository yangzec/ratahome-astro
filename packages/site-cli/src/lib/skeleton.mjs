import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CLEAR_ARRAY_KEYS = new Set([
  'items',
  'steps',
  'cases',
  'testimonials',
  'footerFeatures',
  'workflow',
  'aboutAudiences',
  'collectionPackages',
  'packageBenefits',
  'collectionBenefits',
  'styles',
]);

export function wipeCopy(value, key = '') {
  if (Array.isArray(value)) {
    if (CLEAR_ARRAY_KEYS.has(key)) return [];
    return value.map((item) => wipeCopy(item, key));
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [nextKey, nextValue] of Object.entries(value)) {
      out[nextKey] = wipeCopy(nextValue, nextKey);
    }
    return out;
  }

  if (typeof value !== 'string') return value;
  if (key === 'icon' && value.startsWith('/icons/')) return value;
  if (key === 'anchorId' && /^[a-z0-9-]+$/i.test(value)) return value;
  if (key === 'ctaHref' && value.startsWith('#')) return value;
  return '';
}

export function skeletonNavigation() {
  return {
    main: [
      { id: 'about', label: '', href: '/about' },
      { id: 'contact', label: '', href: '/contact' },
    ],
  };
}

export function emptyIndustryBrief() {
  return {
    visitors: [],
    deliverables: [],
    catalogPrefix: '',
    catalog: [],
    pages: [],
  };
}

export function normalizeIndustryBrief(brief) {
  const empty = emptyIndustryBrief();
  if (!brief || typeof brief !== 'object') return empty;
  return {
    visitors: asStringList(brief.visitors),
    deliverables: asStringList(brief.deliverables),
    catalogPrefix: slugifyPrefix(brief.catalogPrefix),
    catalog: asStringList(brief.catalog),
    pages: asStringList(brief.pages),
  };
}

function asStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function slugifyPrefix(value) {
  return String(value ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase();
}

export function tsStringArray(name, values) {
  if (!values.length) return `export const ${name} = [];\n`;
  return `export const ${name} = [\n${values.map((item) => `  '${item}',`).join('\n')}\n];\n`;
}

export function cleanSlugsSource(brief) {
  const industry = normalizeIndustryBrief(brief);
  return `${tsStringArray('catalogSlugs', industry.catalog)}${tsStringArray('pageSlugs', industry.pages)}`;
}

export function cleanSlugPageSource(brief) {
  const industry = normalizeIndustryBrief(brief);
  const prefix = industry.catalogPrefix || 'catalog';
  return `import type { Locale } from '@trade/core/i18n/config';
import { getContent } from './content';
import { catalogSlugs, pageSlugs } from '../data/slugs';

export function getSlugStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: Record<string, unknown> }> = [];

  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of catalogSlugs) {
    paths.push({ params: { slug: \`${prefix}/\${slug}\` }, props: { type: 'catalog', slug } });
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
`;
}

export function emptySlugArrays(source) {
  return source.replace(
    /export const (\w+)\s*(?::\s*string\[\])?\s*=\s*\[[\s\S]*?\];/g,
    (match, name) =>
      /:\s*string\[\]/.test(match)
        ? `export const ${name}: string[] = [];`
        : `export const ${name} = [];`
  );
}

export function skeletonLogoSvg(name) {
  const label = String(name || 'SITE').toUpperCase();
  const width = Math.max(800, label.length * 48);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 120" role="img" aria-label="${escapeXml(name)}">
  <text x="0" y="86" fill="#111111" font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="64" font-weight="300" letter-spacing="8">${escapeXml(label)}</text>
</svg>
`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function writeSkeletonContent({ sourceDir, targetDir, displayName, brief } = {}) {
  const industry = normalizeIndustryBrief(brief);
  for (const locale of ['en', 'zh']) {
    const sourceLocale = join(sourceDir, 'content', locale);
    const targetLocale = join(targetDir, 'content', locale);
    mkdirSync(targetLocale, { recursive: true });
    if (!existsSync(sourceLocale)) continue;

    for (const file of readdirSync(sourceLocale)) {
      if (!file.endsWith('.json')) continue;
      const raw = JSON.parse(readFileSync(join(sourceLocale, file), 'utf8'));
      let next = wipeCopy(raw);

      if (file === 'navigation.json') {
        next = skeletonNavigation();
      }

      if (file === 'pages.json' && next && typeof next === 'object') {
        next.slugs = {};
      }

      if (file === 'common.json' && locale === 'en' && next.site) {
        next.site.name = displayName;
      }

      if (file === 'home.json' && next.rooms && typeof next.rooms === 'object') {
        next.rooms.basePath = industry.catalogPrefix ? `/${industry.catalogPrefix}` : '';
      }

      writeFileSync(join(targetLocale, file), `${JSON.stringify(next, null, 2)}\n`);
    }
  }

  const slugsPath = join(targetDir, 'src/data/slugs.ts');
  mkdirSync(join(targetDir, 'src/data'), { recursive: true });
  writeFileSync(slugsPath, cleanSlugsSource(industry));

  const slugPagePath = join(targetDir, 'src/lib/slug-page.ts');
  mkdirSync(join(targetDir, 'src/lib'), { recursive: true });
  writeFileSync(slugPagePath, cleanSlugPageSource(industry));

  writeFileSync(join(targetDir, 'industry.json'), `${JSON.stringify(industry, null, 2)}\n`);

  const imagesDir = join(targetDir, 'public/images');
  mkdirSync(imagesDir, { recursive: true });
  writeFileSync(join(imagesDir, 'logo.svg'), skeletonLogoSvg(displayName));
}
