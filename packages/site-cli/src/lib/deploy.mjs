import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertSiteExists, getWorkspaceRoot } from './paths.mjs';

export function deploySite(slug, { dryRun = false, root = getWorkspaceRoot() } = {}) {
  const siteDir = assertSiteExists(slug, root);
  const pkg = JSON.parse(readFileSync(join(siteDir, 'package.json'), 'utf8'));
  const packageName = pkg.name;

  if (!packageName) {
    throw new Error(`sites/${slug}/package.json has no name field`);
  }

  const steps = [
    { label: 'build', cmd: 'pnpm', args: ['--filter', packageName, 'build'] },
    { label: 'deploy', cmd: 'pnpm', args: ['--filter', packageName, 'exec', 'wrangler', 'deploy'] },
  ];

  if (dryRun) {
    return { slug, packageName, steps, dryRun: true };
  }

  for (const step of steps) {
    const result = spawnSync(step.cmd, step.args, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    if (result.status !== 0) {
      throw new Error(`${step.label} failed for sites/${slug}`);
    }
  }

  return { slug, packageName, ok: true };
}
