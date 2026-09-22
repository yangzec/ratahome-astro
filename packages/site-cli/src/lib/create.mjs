import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSiteDir, getWorkspaceRoot } from './paths.mjs';
import { resolveTemplate } from './templates.mjs';
import { scanSiteContentDirtyTokens } from './dirty-tokens.mjs';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', '.wrangler']);

function titleFromSlug(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function replaceInFile(path, replacements) {
  let content = readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  writeFileSync(path, content);
}

export function createSite({ slug, templateId, siteId, name, root = getWorkspaceRoot() }) {
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
    throw new Error('Slug must be kebab-case (lowercase letters, numbers, hyphens)');
  }

  const targetDir = getSiteDir(slug, root);
  if (existsSync(targetDir)) {
    throw new Error(`Site already exists: sites/${slug}`);
  }

  const template = resolveTemplate(templateId, root);
  const id = siteId ?? slug;
  const displayName = name ?? titleFromSlug(slug);

  cpSync(template.sourceDir, targetDir, {
    recursive: true,
    filter: (src) => {
      const base = src.split('/').pop() ?? '';
      return !SKIP_DIRS.has(base);
    },
  });

  const oldId = readSiteIdFromConfig(template.sourceDir);

  replaceInFile(join(targetDir, 'site.config.ts'), [
    [`siteId: '${oldId}'`, `siteId: '${id}'`],
    [`name: '${readSiteName(template.sourceDir)}'`, `name: '${displayName}'`],
    [`template: '${readSiteTemplate(template.sourceDir)}'`, `template: '${templateId}'`],
  ]);

  replaceInFile(join(targetDir, 'wrangler.jsonc'), [
    [`"name": "${template.sourceSlug}"`, `"name": "${slug}"`],
    [`"SITE_ID": "${oldId}"`, `"SITE_ID": "${id}"`],
  ]);

  replaceInFile(join(targetDir, 'package.json'), [
    [`"name": "${template.sourceSlug}"`, `"name": "${slug}"`],
  ]);

  const dirty = scanSiteContentDirtyTokens(targetDir);
  if (dirty.length) {
    rmSync(targetDir, { recursive: true, force: true });
    throw new Error(
      `New site content still has furniture/sock leftover tokens. Template source must be the empty shell (sites/b2b-shell), not a filled demo.\n  ${dirty.join('\n  ')}`
    );
  }

  return { slug, siteId: id, name: displayName, templateId, path: targetDir };
}

function readSiteIdFromConfig(siteDir) {
  const raw = readFileSync(join(siteDir, 'site.config.ts'), 'utf8');
  const m = raw.match(/siteId:\s*'([^']+)'/);
  if (!m) throw new Error(`Could not read siteId from ${siteDir}/site.config.ts`);
  return m[1];
}

function readSiteName(siteDir) {
  const raw = readFileSync(join(siteDir, 'site.config.ts'), 'utf8');
  const m = raw.match(/name:\s*'([^']+)'/);
  return m?.[1] ?? 'Site';
}

function readSiteTemplate(siteDir) {
  const raw = readFileSync(join(siteDir, 'site.config.ts'), 'utf8');
  const m = raw.match(/template:\s*'([^']+)'/);
  return m?.[1] ?? 'b2b-manufacturing';
}
