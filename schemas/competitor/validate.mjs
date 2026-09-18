#!/usr/bin/env node
/**
 * Validates competitor schemas + the ratahome-self fixture.
 * No extra dependencies: required fields, enums, mapping completeness.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const workspace = join(root, '../..');
const exampleDir = join(root, 'examples/ratahome-self');
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function ok(message) {
  console.log(`ok    ${message}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadSchema(name) {
  return readJson(join(root, name));
}

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateAgainstSchema(data, schema, path, schemaRoot = schema) {
  if (schema.$ref) {
    const ref = schema.$ref.replace('#/', '').split('/');
    let node = schemaRoot;
    for (const key of ref) node = node?.[key];
    if (!node) {
      fail(`${path}: unresolved $ref ${schema.$ref}`);
      return;
    }
    validateAgainstSchema(data, node, path, schemaRoot);
    return;
  }

  if (schema.const !== undefined && data !== schema.const) {
    fail(`${path}: expected const ${JSON.stringify(schema.const)}`);
  }
  if (schema.type && typeOf(data) !== schema.type && !(schema.type === 'integer' && Number.isInteger(data))) {
    if (!(schema.type === 'number' && typeof data === 'number')) {
      fail(`${path}: expected ${schema.type}, got ${typeOf(data)}`);
      return;
    }
  }
  if (schema.enum && !schema.enum.includes(data)) {
    fail(`${path}: ${JSON.stringify(data)} not in enum`);
  }
  if (schema.type === 'object' && data && typeof data === 'object') {
    for (const key of schema.required ?? []) {
      if (!(key in data)) fail(`${path}: missing required "${key}"`);
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(data)) {
        if (!allowed.has(key)) fail(`${path}: unexpected property "${key}"`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in data) validateAgainstSchema(data[key], child, `${path}.${key}`, schemaRoot);
    }
  }
  if (schema.type === 'array' && Array.isArray(data) && schema.items) {
    if (schema.minItems && data.length < schema.minItems) {
      fail(`${path}: expected minItems ${schema.minItems}`);
    }
    data.forEach((item, i) => validateAgainstSchema(item, schema.items, `${path}[${i}]`, schemaRoot));
  }
}

function parseFrontmatter(markdownPath) {
  const raw = readFileSync(markdownPath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(`${relative(root, markdownPath)}: missing YAML frontmatter`);
    return null;
  }
  const data = {};
  let currentKey = null;
  for (const line of match[1].split('\n')) {
    const nested = line.match(/^  - (.+)$/);
    if (nested && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(nested[1].replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    currentKey = key;
    if (value === '') {
      data[key] = [];
    } else if (/^\d+$/.test(value)) {
      data[key] = Number(value);
    } else {
      data[key] = value.replace(/^["']|["']$/g, '');
    }
  }
  return data;
}

function listMarkdown(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) listMarkdown(path, acc);
    else if (name.name.endsWith('.md')) acc.push(path);
  }
  return acc;
}

const collection = readJson(join(exampleDir, 'collection.json'));
validateAgainstSchema(collection, loadSchema('collection.schema.json'), 'collection.json');
ok('collection.json schema');

const fileChecks = {
  'meta.json': 'meta.schema.json',
  'ia.json': 'ia.schema.json',
  'theme-tokens.json': 'theme-tokens.schema.json',
  'images/manifest.json': 'images-manifest.schema.json',
  'products.json': 'products.schema.json',
  'forms/contact.json': 'form.schema.json',
  'sections/home.json': 'sections.schema.json',
};

for (const [rel, schemaName] of Object.entries(fileChecks)) {
  const path = join(exampleDir, rel);
  if (!existsSync(path)) {
    fail(`missing example ${rel}`);
    continue;
  }
  validateAgainstSchema(readJson(path), loadSchema(schemaName), rel);
  ok(`${rel} schema`);
}

for (const rel of [
  ...(collection.files.pages ?? []),
  ...(collection.files.sections ?? []),
  ...(collection.files.forms ?? []),
  collection.files.meta,
  collection.files.ia,
  collection.files.themeTokens,
  collection.files.imagesManifest,
  collection.files.products,
]) {
  if (rel && !existsSync(join(exampleDir, rel))) fail(`collection.files missing on disk: ${rel}`);
}
ok('collection.files exist on disk');

const pageSchema = loadSchema('page.schema.json');
for (const md of listMarkdown(join(exampleDir, 'pages'))) {
  const fm = parseFrontmatter(md);
  if (fm) {
    if (fm.schemaVersion) fm.schemaVersion = Number(fm.schemaVersion);
    if (fm.status) fm.status = Number(fm.status);
    validateAgainstSchema(fm, pageSchema, relative(exampleDir, md));
  }
}
ok('page frontmatter');

const mapping = readJson(join(root, 'mapping.json'));
const registry = readFileSync(join(workspace, 'packages/sections/src/registry.ts'), 'utf8');
const registryIds = [...registry.matchAll(/^\s+(?:'([^']+)'|([a-z0-9-]+)):/gm)].map(
  (m) => m[1] ?? m[2],
);
const mappedBlueprintIds = new Set(
  Object.values(mapping.sectionRoles)
    .map((role) => role.blueprintId)
    .filter(Boolean),
);
for (const id of registryIds) {
  if (!mappedBlueprintIds.has(id)) fail(`section registry "${id}" has no mapping.sectionRoles.blueprintId`);
}
ok(`registry IDs mapped (${registryIds.length})`);

const home = readJson(join(workspace, 'sites/ratahome-furniture/content/en/home.json'));
const homeTargets = new Set(
  (mapping.targets['content/{locale}/home.json'] ?? []).map((row) => row.to),
);
for (const key of Object.keys(home)) {
  const pointer = `/${key}`;
  if (!homeTargets.has(pointer)) fail(`home.json key "${key}" missing from mapping targets`);
}
ok('home.json keys mapped');

const requiredSiteFiles = [
  'sites/ratahome-furniture/site.config.ts',
  'sites/ratahome-furniture/theme.json',
  'sites/ratahome-furniture/blueprints/home.json',
  'sites/ratahome-furniture/content/en/common.json',
  'sites/ratahome-furniture/content/en/home.json',
  'sites/ratahome-furniture/content/en/navigation.json',
  'sites/ratahome-furniture/content/en/pages.json',
  'sites/ratahome-furniture/src/data/slugs.ts',
  'packages/site-cli/templates.json',
];
for (const rel of requiredSiteFiles) {
  if (!existsSync(join(workspace, rel))) fail(`mapping target missing: ${rel}`);
}
ok('mapping target files exist');

const homeSections = readJson(join(exampleDir, 'sections/home.json'));
for (const id of homeSections.suggestedBlueprint) {
  if (!registryIds.includes(id)) fail(`suggestedBlueprint unknown section "${id}"`);
}
ok('example blueprint IDs are registered');

const requiredPageTypes = Object.entries(mapping.pageTypes)
  .filter(([, spec]) => spec.required)
  .map(([type]) => type);
const exampleTypes = new Set(
  readJson(join(exampleDir, 'ia.json')).pages.filter((p) => p.inPhase1).map((p) => p.pageType),
);
for (const type of requiredPageTypes) {
  const spec = mapping.pageTypes[type];
  if (spec.alternateOf && spec.alternateOf.some((alt) => exampleTypes.has(alt))) continue;
  if (!exampleTypes.has(type)) fail(`phase-1 fixture missing pageType "${type}"`);
}
ok('phase-1 page types present in fixture');

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\ncompetitor model validation passed');
