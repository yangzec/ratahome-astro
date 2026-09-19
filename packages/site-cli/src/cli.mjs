#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { createSite } from './lib/create.mjs';
import { deploySite } from './lib/deploy.mjs';
import { validateSite } from './lib/validate.mjs';
import { loadTemplates } from './lib/templates.mjs';
import { getWorkspaceRoot, listSiteSlugs } from './lib/paths.mjs';
import { briefHasObjects, briefHasVoiceInputs } from './lib/skeleton.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    from: { type: 'string' },
    'site-id': { type: 'string' },
    name: { type: 'string' },
    brief: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    all: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const [command, slug] = positionals;

function printHelp() {
  console.log(`
trade-site-cli — scaffold and manage trade independent sites

Usage:
  site-cli create <slug> --from <template> [--site-id <id>] [--name <name>] [--brief <file>]
      copies a clean skeleton (no source-site prose, slugs, or catalog copy).
      optional --brief JSON writes industry.json (objects, pains, phrases, references) and catalog routes.
  site-cli validate <slug>
  site-cli validate --all
      errors on empty copy, leftover source-site copy, dead nav / catalog links,
      and Layer A copy guards (CJK in en, internal tokens, unknown SECTION_MAP ids,
      missing home.json keys). Layer B (TypeSafe Jev) runs when TYPESAFE_API_KEY is set:
      block fails validate; review prints warnings and still exits 0.
  site-cli deploy <slug> [--dry-run]
  site-cli templates

Templates:
${Object.entries(loadTemplates())
  .map(([id, t]) => `  ${id.padEnd(20)} ${t.description}`)
  .join('\n')}

Examples:
  site-cli create textile-fabric --from b2b-manufacturing --name "Textile Fabric"
  site-cli validate textile-fabric
  site-cli validate --all
  site-cli deploy ratahome-furniture --dry-run
`);
}

function printResult(result, label) {
  if (result.errors?.length) {
    console.error(`\n✗ ${label} failed:\n`);
    for (const e of result.errors) console.error(`  • ${e}`);
  }
  if (result.warnings?.length) {
    console.warn(`\n⚠ warnings:\n`);
    for (const w of result.warnings) console.warn(`  • ${w}`);
  }
  if (result.ok) {
    console.log(`\n✓ ${label} passed for sites/${result.slug}`);
    if (result.siteId) console.log(`  site_id: ${result.siteId}`);
    if (result.template) console.log(`  template: ${result.template}`);
    if (result.copy?.layerB) console.log(`  copy Layer B: ${result.copy.layerB}`);
  }
}

async function runValidate(target, root) {
  const result = await validateSite(target, root);
  printResult(result, 'Validation');
  return result;
}

async function main() {
  if (values.help || !command) {
    printHelp();
    process.exit(command ? 0 : 1);
  }

  const root = getWorkspaceRoot();

  switch (command) {
    case 'create': {
      if (!slug) throw new Error('create requires <slug>');
      if (!values.from) throw new Error('create requires --from <template>');
      const brief = values.brief
        ? JSON.parse(readFileSync(values.brief, 'utf8'))
        : undefined;
      const created = createSite({
        slug,
        templateId: values.from,
        siteId: values['site-id'],
        name: values.name,
        brief,
        root,
      });
      console.log(`\n✓ Scaffolded sites/${created.slug} as a clean skeleton`);
      console.log(`  site_id: ${created.siteId}`);
      console.log(`  template: ${created.templateId}`);
      console.log(`  name: ${created.name}`);
      console.log(`  brief: sites/${created.slug}/industry.json`);
      if (briefHasObjects(created.industry) && !briefHasVoiceInputs(created.industry)) {
        console.warn('\n⚠ industry.json has objects but no pains / phrases / references.');
        console.warn('  Fill those before writing copy. See packages/site-cli/prompts/write-copy.md');
      }
      const result = await runValidate(slug, root);
      console.log(`\nWrite content/{en,zh}/ with packages/site-cli/prompts/write-copy.md`);
      console.log(`using sites/${created.slug}/industry.json then re-run:`);
      console.log(`  site-cli validate ${created.slug}`);
      if (!result.ok) process.exit(1);
      break;
    }
    case 'validate': {
      const slugs = values.all ? listSiteSlugs(root) : slug ? [slug] : [];
      if (!slugs.length) throw new Error('validate requires <slug> or --all');
      let failed = 0;
      for (const target of slugs) {
        if (values.all) console.log(`\n── sites/${target} ──`);
        const result = await runValidate(target, root);
        if (!result.ok) failed += 1;
      }
      if (failed) process.exit(1);
      break;
    }
    case 'deploy': {
      if (!slug) throw new Error('deploy requires <slug>');
      if (values['dry-run']) {
        const plan = await deploySite(slug, { dryRun: true, root });
        console.log(`\nDeploy plan for sites/${plan.slug} (package: ${plan.packageName}):`);
        for (const step of plan.steps) {
          console.log(`  ${step.cmd} ${step.args.join(' ')}`);
        }
      } else {
        console.log(`Deploying sites/${slug}...`);
        await deploySite(slug, { root });
        console.log(`\n✓ Deploy complete for sites/${slug}`);
      }
      break;
    }
    case 'templates': {
      const templates = loadTemplates();
      for (const [id, t] of Object.entries(templates)) {
        console.log(`${id}\n  skeleton: packages/site-cli/skeletons/${t.skeleton ?? id}\n  leak-check: sites/${t.source}\n  ${t.description}\n`);
      }
      break;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
});
