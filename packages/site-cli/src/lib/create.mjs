import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSiteDir, getWorkspaceRoot } from './paths.mjs';
import { resolveTemplate } from './templates.mjs';
import { writeSkeletonContent } from './skeleton.mjs';

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

export function createSite({ slug, templateId, siteId, name, brief, root = getWorkspaceRoot() }) {
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

  cpSync(template.skeletonDir, targetDir, {
    recursive: true,
    filter: (src) => {
      const base = src.split('/').pop() ?? '';
      if (SKIP_DIRS.has(base)) return false;
      return true;
    },
  });

  const oldId = readSiteIdFromConfig(template.skeletonDir);

  replaceInFile(join(targetDir, 'site.config.ts'), [
    [`siteId: '${oldId}'`, `siteId: '${id}'`],
    [`name: '${readSiteName(template.skeletonDir)}'`, `name: '${displayName}'`],
    [`template: '${readSiteTemplate(template.skeletonDir)}'`, `template: '${templateId}'`],
  ]);

  replaceInFile(join(targetDir, 'wrangler.jsonc'), [
    [`"name": "${oldId}"`, `"name": "${slug}"`],
    [`"SITE_ID": "${oldId}"`, `"SITE_ID": "${id}"`],
  ]);

  replaceInFile(join(targetDir, 'package.json'), [
    [`"name": "${oldId}"`, `"name": "${slug}"`],
  ]);

  writeSkeletonContent({
    sourceDir: template.skeletonDir,
    targetDir,
    displayName,
    brief,
  });
  retargetLogo(targetDir);

  return { slug, siteId: id, name: displayName, templateId, path: targetDir, skeleton: true };
}

function retargetLogo(targetDir) {
  for (const file of [
    'src/components/layout/Header.astro',
    'src/components/layout/Footer.astro',
    'src/layouts/BaseLayout.astro',
  ]) {
    const path = join(targetDir, file);
    if (!existsSync(path)) continue;
    replaceInFile(path, [
      ['/images/logo.png', '/images/logo.svg'],
      ['type="image/png"', 'type="image/svg+xml"'],
    ]);
  }
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
