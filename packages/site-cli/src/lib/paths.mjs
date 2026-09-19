import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Walk up until pnpm-workspace.yaml is found */
export function getWorkspaceRoot() {
  let dir = resolve(__dirname, '../..');
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  throw new Error('Could not find monorepo root (pnpm-workspace.yaml)');
}

export function getSitesDir(root = getWorkspaceRoot()) {
  return join(root, 'sites');
}

/** Site directory names under sites/, excluding dotfiles. */
export function listSiteSlugs(root = getWorkspaceRoot()) {
  const dir = getSitesDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

export function getSiteDir(slug, root = getWorkspaceRoot()) {
  return join(getSitesDir(root), slug);
}

export function getSkeletonDir(templateId, root = getWorkspaceRoot()) {
  return join(root, 'packages/site-cli/skeletons', templateId);
}

export function assertSiteExists(slug, root = getWorkspaceRoot()) {
  const dir = getSiteDir(slug, root);
  if (!existsSync(dir)) {
    throw new Error(`Site not found: sites/${slug}`);
  }
  return dir;
}
