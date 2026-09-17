import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { getSiteDir } from './paths.mjs';

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
  const sourceDir = getSiteDir(template.source, root);
  if (!existsSync(sourceDir)) {
    throw new Error(`Template source site missing: sites/${template.source}`);
  }
  return { ...template, sourceDir, sourceSlug: template.source };
}
