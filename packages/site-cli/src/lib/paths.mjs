import { existsSync } from 'node:fs';
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

export function getSiteDir(slug, root = getWorkspaceRoot()) {
  return join(getSitesDir(root), slug);
}

export function assertSiteExists(slug, root = getWorkspaceRoot()) {
  const dir = getSiteDir(slug, root);
  if (!existsSync(dir)) {
    throw new Error(`Site not found: sites/${slug}`);
  }
  return dir;
}
