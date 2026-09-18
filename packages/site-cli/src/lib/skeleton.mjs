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

export function writeSkeletonContent({ sourceDir, targetDir, displayName }) {
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

      writeFileSync(join(targetLocale, file), `${JSON.stringify(next, null, 2)}\n`);
    }
  }

  const slugsPath = join(targetDir, 'src/data/slugs.ts');
  if (existsSync(slugsPath)) {
    writeFileSync(slugsPath, emptySlugArrays(readFileSync(slugsPath, 'utf8')));
  }

  const imagesDir = join(targetDir, 'public/images');
  mkdirSync(imagesDir, { recursive: true });
  writeFileSync(join(imagesDir, 'logo.svg'), skeletonLogoSvg(displayName));
}
