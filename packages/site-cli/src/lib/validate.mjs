import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assertSiteExists, getWorkspaceRoot } from './paths.mjs';
import { loadTemplates } from './templates.mjs';
import { collectGeneratedRoutes, collectNavHrefs, normalizeHref, parseSlugArrays } from './routes.mjs';

const REQUIRED_FILES = [
  'site.config.ts',
  'theme.json',
  'blueprints/home.json',
  'content/en/common.json',
  'content/en/home.json',
  'content/en/navigation.json',
  'content/en/pages.json',
  'content/zh/common.json',
  'content/zh/home.json',
  'content/zh/navigation.json',
  'content/zh/pages.json',
  'package.json',
  'wrangler.jsonc',
  'astro.config.mjs',
  'src/lib/content.ts',
  'src/lib/sections.ts',
];

const THEME_COLOR_KEYS = [
  'accent', 'ink', 'charcoal', 'grayText', 'grayMuted', 'cream',
  'creamDeep', 'stone', 'border', 'olive', 'oliveDark', 'chrome',
];

const REQUIRED_STRINGS = [
  ['common.json', 'site.name'],
  ['common.json', 'site.title'],
  ['common.json', 'site.description'],
  ['common.json', 'site.tagline'],
  ['common.json', 'buttons.startProject'],
  ['home.json', 'hero.title'],
  ['home.json', 'hero.description'],
  ['home.json', 'cta.title'],
  ['home.json', 'cta.formTitle'],
  ['pages.json', 'about.heroTitle'],
  ['pages.json', 'contact.heroTitle'],
];

const SOURCE_LEAK_FIELDS = [
  ['content/en/home.json', 'hero.title'],
  ['content/en/home.json', 'hero.description'],
  ['content/en/home.json', 'cta.formTitle'],
  ['content/en/home.json', 'metrics'],
  ['content/en/common.json', 'site.tagline'],
  ['content/en/common.json', 'buttons.uploadFloorPlan'],
  ['content/en/common.json', 'form.messagePlaceholder'],
  ['content/en/navigation.json', 'main'],
  ['content/zh/home.json', 'hero.title'],
  ['content/zh/common.json', 'site.tagline'],
];

export function validateSite(slug, root = getWorkspaceRoot()) {
  const siteDir = assertSiteExists(slug, root);
  const errors = [];
  const warnings = [];

  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(siteDir, file))) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  let siteId;
  let template;
  try {
    const configRaw = readFileSync(join(siteDir, 'site.config.ts'), 'utf8');
    siteId = configRaw.match(/siteId:\s*'([^']+)'/)?.[1];
    template = configRaw.match(/template:\s*'([^']+)'/)?.[1];
    if (!siteId) errors.push('site.config.ts: siteId is required');
  } catch {
    errors.push('site.config.ts: unreadable');
  }

  try {
    const wranglerRaw = readFileSync(join(siteDir, 'wrangler.jsonc'), 'utf8');
    const siteIdMatch = wranglerRaw.match(/"SITE_ID":\s*"([^"]+)"/);
    if (siteId && siteIdMatch?.[1] !== siteId) {
      errors.push(`wrangler.jsonc SITE_ID (${siteIdMatch?.[1]}) does not match site.config siteId (${siteId})`);
    }
  } catch {
    errors.push('wrangler.jsonc: unreadable');
  }

  try {
    const theme = JSON.parse(readFileSync(join(siteDir, 'theme.json'), 'utf8'));
    for (const key of THEME_COLOR_KEYS) {
      if (!theme.colors?.[key]) {
        errors.push(`theme.json: missing colors.${key}`);
      }
    }
  } catch (e) {
    errors.push(`theme.json: ${e.message}`);
  }

  const sectionIds = loadSectionRegistryIds(root);
  try {
    const blueprint = JSON.parse(readFileSync(join(siteDir, 'blueprints/home.json'), 'utf8'));
    if (!Array.isArray(blueprint.sections) || blueprint.sections.length === 0) {
      errors.push('blueprints/home.json: sections must be a non-empty array');
    } else {
      for (const id of blueprint.sections) {
        if (!sectionIds.has(id)) {
          errors.push(`blueprints/home.json: unknown section "${id}" (not in sectionRegistry)`);
        }
      }
    }
  } catch (e) {
    errors.push(`blueprints/home.json: ${e.message}`);
  }

  const parsed = {};
  for (const locale of ['en', 'zh']) {
    const localeDir = join(siteDir, 'content', locale);
    if (!existsSync(localeDir)) {
      errors.push(`Missing content/${locale}/ directory`);
      continue;
    }
    for (const file of readdirSync(localeDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        parsed[`${locale}/${file}`] = JSON.parse(readFileSync(join(localeDir, file), 'utf8'));
      } catch (e) {
        errors.push(`content/${locale}/${file}: invalid JSON — ${e.message}`);
      }
    }
  }

  for (const locale of ['en', 'zh']) {
    for (const [file, path] of REQUIRED_STRINGS) {
      const value = getPath(parsed[`${locale}/${file}`], path);
      if (typeof value !== 'string' || !value.trim()) {
        errors.push(`content/${locale}/${file}: ${path} is empty — write industry copy`);
      }
    }
  }

  const routes = collectGeneratedRoutes(siteDir);
  for (const locale of ['en', 'zh']) {
    const nav = parsed[`${locale}/navigation.json`];
    if (!nav) continue;
    for (const href of collectNavHrefs(nav.main ?? [])) {
      assertResolvableHref(href, routes, errors, `content/${locale}/navigation.json`);
    }
    for (const item of nav.main ?? []) {
      if (typeof item.label !== 'string' || !item.label.trim()) {
        errors.push(`content/${locale}/navigation.json: nav item "${item.id ?? hrefOf(item)}" has an empty label`);
      }
    }
  }

  for (const locale of ['en', 'zh']) {
    const home = parsed[`${locale}/home.json`];
    if (!home) continue;

    const rooms = home.rooms ?? {};
    if (!Array.isArray(rooms.items) || rooms.items.length === 0) {
      errors.push(`content/${locale}/home.json: rooms.items is empty — define this site's catalog`);
    } else {
      const basePath = normalizeHref(rooms.basePath ?? '/collections');
      for (const room of rooms.items) {
        if (!room?.slug) {
          errors.push(`content/${locale}/home.json: rooms item missing slug`);
          continue;
        }
        const href = basePath ? `/${basePath}/${room.slug}` : `/${room.slug}`;
        assertResolvableHref(href, routes, errors, `content/${locale}/home.json rooms`);
      }
    }

    for (const item of home.audiences?.items ?? []) {
      if (item?.href) {
        assertResolvableHref(item.href, routes, errors, `content/${locale}/home.json audiences`);
      }
    }
  }

  try {
    const slugsTs = readFileSync(join(siteDir, 'src/data/slugs.ts'), 'utf8');
    const pageSlugList = parseSlugArrays(slugsTs).pageSlugs ?? [];
    const enSlugs = parsed['en/pages.json']?.slugs ?? {};
    const zhSlugs = parsed['zh/pages.json']?.slugs ?? {};
    for (const pageSlug of pageSlugList) {
      if (!String(enSlugs[pageSlug]?.title ?? '').trim()) {
        errors.push(`content/en/pages.json: slugs.${pageSlug}.title is empty`);
      }
      if (!String(zhSlugs[pageSlug]?.title ?? '').trim()) {
        errors.push(`content/zh/pages.json: slugs.${pageSlug}.title is empty`);
      }
    }
  } catch (e) {
    errors.push(`src/data/slugs.ts: unreadable — ${e.message}`);
  }

  if (template) {
    errors.push(...findSourceCopyLeaks({ slug, template, siteDir, root }));
  }

  for (const [fileKey, data] of Object.entries(parsed)) {
    errors.push(...findContrastCopyLeaks(data, `content/${fileKey}`));
  }

  return {
    slug,
    siteId,
    template,
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    warnings,
  };
}

function assertResolvableHref(href, routes, errors, where) {
  if (!href || href.startsWith('http') || href.startsWith('#')) return;
  const path = normalizeHref(href);
  if (!path) {
    errors.push(`${where}: empty href`);
    return;
  }
  if (!routes.has(path)) {
    errors.push(`${where}: "${href}" has no generated route`);
  }
}

function hrefOf(item) {
  return item?.href ?? 'unknown';
}

function getPath(value, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], value);
}

const CONTRAST_COPY = [
  /而[不非]是\s*\S{1,16}(贸易商|出口商|工厂|站点|模板|行业)/,
  /不是\s*\S{1,12}(贸易商|站点|模板)/,
  /\bnot\s+(a\s+|the\s+)?\w+[\s-]+\w*\s*(traders?|mills?|exporters?|sites?|templates?)\b/i,
  /\bbuilt for\b[\s\S]{0,80}\bnot\b/i,
  /\bunlike\s+(our\s+)?(other|sister|source|template)\b/i,
];

function findContrastCopyLeaks(value, where, errors = []) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (CONTRAST_COPY.some((re) => re.test(text))) {
      errors.push(`${where}: visitor copy must not define this site by negating another site or category — rewrite "${truncate(text)}"`);
    }
    return errors;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findContrastCopyLeaks(item, `${where}[${index}]`, errors));
    return errors;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      findContrastCopyLeaks(child, `${where}.${key}`, errors);
    }
  }
  return errors;
}

function truncate(text, max = 72) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function findSourceCopyLeaks({ slug, template, siteDir, root }) {
  const errors = [];
  let sourceSlug;
  try {
    sourceSlug = loadTemplates()[template]?.source;
  } catch {
    return errors;
  }
  if (!sourceSlug || sourceSlug === slug) return errors;

  const sourceDir = join(root, 'sites', sourceSlug);
  if (!existsSync(sourceDir)) return errors;

  for (const [relPath, field] of SOURCE_LEAK_FIELDS) {
    const siteValue = readField(join(siteDir, relPath), field);
    const sourceValue = readField(join(sourceDir, relPath), field);
    if (isEmptyValue(siteValue) || isEmptyValue(sourceValue)) continue;
    if (stableEqual(siteValue, sourceValue)) {
      errors.push(`${relPath}: ${field} still matches source site ${sourceSlug} — write this site's copy`);
    }
  }

  return errors;
}

function readField(filePath, field) {
  try {
    return getPath(JSON.parse(readFileSync(filePath, 'utf8')), field);
  } catch {
    return undefined;
  }
}

function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function stableEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function loadSectionRegistryIds(root) {
  const registryPath = join(root, 'packages/sections/src/registry.ts');
  const raw = readFileSync(registryPath, 'utf8');
  const ids = new Set();
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*(?:['"]([^'"]+)['"]|([a-z][a-z0-9_-]*))\s*:/);
    const id = m?.[1] ?? m?.[2];
    if (id && id !== 'export' && id !== 'const') ids.add(id);
  }
  return ids;
}
