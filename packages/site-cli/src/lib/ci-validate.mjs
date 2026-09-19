#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { getWorkspaceRoot, listSiteSlugs } from './paths.mjs';
import { resolveValidateTargets } from './copy-check.mjs';
import { validateSite } from './validate.mjs';

function changedFiles(root) {
  const base = process.env.COPY_VALIDATE_BASE_SHA;
  const head = process.env.COPY_VALIDATE_HEAD_SHA;
  if (!base || !head) return null;
  const result = spawnSync('git', ['diff', '--name-only', `${base}...${head}`], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.warn(`copy-validate: git diff failed — ${result.stderr || result.stdout || 'unknown error'}`);
    return null;
  }
  return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

const root = getWorkspaceRoot();
const allSlugs = listSiteSlugs(root);
const files = changedFiles(root);
const targets = files
  ? resolveValidateTargets(files, allSlugs)
  : { slugs: allSlugs, reason: 'no diff SHAs — validating all sites' };

console.log(`copy-validate: ${targets.reason}`);
if (!targets.slugs.length) {
  console.log('copy-validate: nothing to validate');
  process.exit(0);
}

console.log(`copy-validate: ${targets.slugs.join(', ')}`);
if (!process.env.TYPESAFE_API_KEY) {
  console.warn('copy-validate: TYPESAFE_API_KEY unset — Layer A only');
}

let failed = 0;
for (const slug of targets.slugs) {
  console.log(`\n── sites/${slug} ──`);
  const result = await validateSite(slug, root);
  if (result.errors.length) {
    console.error('errors:');
    for (const error of result.errors) console.error(`  • ${error}`);
  }
  if (result.warnings.length) {
    console.warn('warnings:');
    for (const warning of result.warnings) console.warn(`  • ${warning}`);
  }
  if (result.ok) {
    console.log(`ok (Layer B: ${result.copy?.layerB ?? 'n/a'})`);
  } else {
    failed += 1;
  }
}

process.exit(failed ? 1 : 0);
