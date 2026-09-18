#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createSite } from './lib/create.mjs';
import { deploySite } from './lib/deploy.mjs';
import { validateSite } from './lib/validate.mjs';
import { loadTemplates } from './lib/templates.mjs';
import { getWorkspaceRoot } from './lib/paths.mjs';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    from: { type: 'string' },
    'site-id': { type: 'string' },
    name: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const [command, slug] = positionals;

function printHelp() {
  console.log(`
trade-site-cli — scaffold and manage trade independent sites

Usage:
  site-cli create <slug> --from <template> [--site-id <id>] [--name <name>]
  site-cli validate <slug>
  site-cli deploy <slug> [--dry-run]
  site-cli templates

Templates:
${Object.entries(loadTemplates())
  .map(([id, t]) => `  ${id.padEnd(20)} ${t.description}`)
  .join('\n')}

Examples:
  site-cli create textile-fabric --from b2b-manufacturing --name "Textile Fabric"
  site-cli validate ratahome-furniture
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
  }
}

try {
  if (values.help || !command) {
    printHelp();
    process.exit(command ? 0 : 1);
  }

  const root = getWorkspaceRoot();

  switch (command) {
    case 'create': {
      if (!slug) throw new Error('create requires <slug>');
      if (!values.from) throw new Error('create requires --from <template>');
      const created = createSite({
        slug,
        templateId: values.from,
        siteId: values['site-id'],
        name: values.name,
        root,
      });
      console.log(`\n✓ Created sites/${created.slug}`);
      console.log(`  site_id: ${created.siteId}`);
      console.log(`  template: ${created.templateId}`);
      console.log(`  name: ${created.name}`);
      console.log(`\nNext steps:`);
      console.log(`  1. Fill sites/${created.slug}/DESIGN.md (buyer, promise, CTA, visual)`);
      console.log(`  2. Map visual to theme.json; homepage intent to blueprints/home.json`);
      console.log(`  3. Edit content in sites/${created.slug}/content/`);
      console.log(`  4. site-cli validate ${created.slug}`);
      console.log(`  5. pnpm --filter ${created.slug} dev`);
      break;
    }
    case 'validate': {
      if (!slug) throw new Error('validate requires <slug>');
      const result = validateSite(slug, root);
      printResult({ ...result, ok: result.ok }, 'Validation');
      if (!result.ok) process.exit(1);
      break;
    }
    case 'deploy': {
      if (!slug) throw new Error('deploy requires <slug>');
      if (values['dry-run']) {
        const plan = deploySite(slug, { dryRun: true, root });
        console.log(`\nDeploy plan for sites/${plan.slug} (package: ${plan.packageName}):`);
        for (const step of plan.steps) {
          console.log(`  ${step.cmd} ${step.args.join(' ')}`);
        }
      } else {
        console.log(`Deploying sites/${slug}...`);
        deploySite(slug, { root });
        console.log(`\n✓ Deploy complete for sites/${slug}`);
      }
      break;
    }
    case 'templates': {
      const templates = loadTemplates();
      for (const [id, t] of Object.entries(templates)) {
        console.log(`${id}\n  source: sites/${t.source}\n  ${t.description}\n`);
      }
      break;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
