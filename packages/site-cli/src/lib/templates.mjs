import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { getSiteDir, getSkeletonDir } from './paths.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadTemplates() {
  const raw = readFileSync(join(__dirname, '../../templates.json'), 'utf8');
  return JSON.parse(raw);
}

export function resolveTemplate(templateId, root) {
  const templates = loadTemplates();
  const template = templates[templateId];
  if (!template) {
    const available = Object.keys(templates).join(', ');
    throw new Error(`Unknown template "${templateId}". Available: ${available}`);
  }
  const skeletonId = template.skeleton ?? templateId;
  const skeletonDir = getSkeletonDir(skeletonId, root);
  if (!existsSync(skeletonDir)) {
    throw new Error(`Template skeleton missing: packages/site-cli/skeletons/${skeletonId}`);
  }

  const sourceSlug = template.source;
  const sourceDir = sourceSlug ? getSiteDir(sourceSlug, root) : '';
  return { ...template, skeletonId, skeletonDir, sourceDir, sourceSlug };
}
