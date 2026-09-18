import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assertSiteExists, getWorkspaceRoot } from './paths.mjs';

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
    const idMatch = configRaw.match(/siteId:\s*'([^']+)'/);
    const templateMatch = configRaw.match(/template:\s*'([^']+)'/);
    siteId = idMatch?.[1];
    template = templateMatch?.[1];
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

  for (const locale of ['en', 'zh']) {
    const localeDir = join(siteDir, 'content', locale);
    if (!existsSync(localeDir)) {
      errors.push(`Missing content/${locale}/ directory`);
      continue;
    }
    for (const file of readdirSync(localeDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        JSON.parse(readFileSync(join(localeDir, file), 'utf8'));
      } catch (e) {
        errors.push(`content/${locale}/${file}: invalid JSON — ${e.message}`);
      }
    }
  }

  const slugSet = collectContentSlugs(siteDir);
  try {
    const nav = JSON.parse(readFileSync(join(siteDir, 'content/en/navigation.json'), 'utf8'));
    collectNavHrefs(nav.main ?? []).forEach((href) => {
      if (href.startsWith('http') || href.startsWith('#')) return;
      const path = href.replace(/^\//, '').replace(/\/$/, '');
      if (path && !slugSet.has(path) && !isKnownRoute(path)) {
        warnings.push(`navigation link "${href}" has no matching page slug`);
      }
    });
  } catch {
    /* navigation parse errors caught above */
  }

  return {
    slug,
    siteId,
    template,
    ok: errors.length === 0,
    errors,
    warnings,
  };
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

function collectContentSlugs(siteDir) {
  const slugs = new Set(['', 'zh', 'about', 'contact', 'collections']);
  try {
    const pages = JSON.parse(readFileSync(join(siteDir, 'content/en/pages.json'), 'utf8'));
    for (const key of Object.keys(pages.slugs ?? {})) {
      slugs.add(key);
    }
  } catch { /* ignore */ }

  const dataSlugs = join(siteDir, 'src/data/slugs.ts');
  if (existsSync(dataSlugs)) {
    const raw = readFileSync(dataSlugs, 'utf8');
    for (const m of raw.matchAll(/'([a-z0-9-]+)'/g)) {
      slugs.add(m[1]);
      slugs.add(`collections/${m[1]}`);
      slugs.add(`joinery/${m[1]}`);
      slugs.add(`projects/${m[1]}`);
    }
  }
  return slugs;
}

function collectNavHrefs(items) {
  const hrefs = [];
  for (const item of items) {
    if (item.href) hrefs.push(item.href);
    for (const group of item.groups ?? []) {
      for (const link of group.links ?? []) {
        if (link.href) hrefs.push(link.href);
      }
    }
    for (const link of item.links ?? []) {
      if (link.href) hrefs.push(link.href);
    }
  }
  return hrefs;
}

function isKnownRoute(path) {
  const top = path.split('/')[0];
  return ['collections', 'fabrics', 'styles', 'products', 'joinery', 'projects', 'zh'].includes(top);
}
