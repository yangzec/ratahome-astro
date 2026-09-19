import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function parseSlugArrays(source) {
  const arrays = {};
  const pattern = /export const (\w+)\s*(?::\s*string\[\])?\s*=\s*\[([\s\S]*?)\]/g;
  for (const match of source.matchAll(pattern)) {
    arrays[match[1]] = [...match[2].matchAll(/'([a-z0-9-]+)'/g)].map((item) => item[1]);
  }
  return arrays;
}

export function parseSlugPathBindings(source) {
  const bindings = [];
  const pattern =
    /for \(const slug of (\w+)\)\s*\{[\s\S]*?params:\s*\{\s*slug(?::\s*`([^`$]+)\/\$\{slug\}`)?/g;
  for (const match of source.matchAll(pattern)) {
    bindings.push({ arrayName: match[1], prefix: match[2] ?? null });
  }
  return bindings;
}

export function normalizeHref(href) {
  if (!href || typeof href !== 'string') return '';
  if (href.startsWith('http') || href.startsWith('#')) return href;
  return href.replace(/^\//, '').replace(/\/$/, '');
}

export function collectGeneratedRoutes(siteDir) {
  const routes = new Set(['about', 'contact']);

  try {
    const pages = JSON.parse(readFileSync(join(siteDir, 'content/en/pages.json'), 'utf8'));
    for (const key of Object.keys(pages.slugs ?? {})) {
      routes.add(key);
    }
  } catch {
    /* pages.json errors are reported elsewhere */
  }

  const slugsPath = join(siteDir, 'src/data/slugs.ts');
  const slugPagePath = join(siteDir, 'src/lib/slug-page.ts');
  if (!existsSync(slugsPath) || !existsSync(slugPagePath)) {
    return routes;
  }

  const arrays = parseSlugArrays(readFileSync(slugsPath, 'utf8'));
  const bindings = parseSlugPathBindings(readFileSync(slugPagePath, 'utf8'));

  for (const binding of bindings) {
    if (binding.prefix) routes.add(binding.prefix);
    for (const slug of arrays[binding.arrayName] ?? []) {
      routes.add(binding.prefix ? `${binding.prefix}/${slug}` : slug);
    }
  }

  return routes;
}

export function collectNavHrefs(items = []) {
  const hrefs = [];
  for (const item of items) {
    if (item.href) hrefs.push(item.href);
    if (item.feature?.href) hrefs.push(item.feature.href);
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
