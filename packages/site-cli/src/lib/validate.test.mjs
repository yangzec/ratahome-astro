import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateSite } from './validate.mjs';
import { createSite } from './create.mjs';
import { getWorkspaceRoot } from './paths.mjs';

const REQUIRED_THEME = {
  colors: {
    accent: '#1', ink: '#1', charcoal: '#1', grayText: '#1', grayMuted: '#1', cream: '#1',
    creamDeep: '#1', stone: '#1', border: '#1', olive: '#1', oliveDark: '#1', chrome: '#1',
  },
};

function writeSite(dir, { slug = 'demo-site', template = 'b2b-textile' } = {}) {
  mkdirSync(join(dir, 'sites', slug, 'blueprints'), { recursive: true });
  mkdirSync(join(dir, 'sites', slug, 'content/en'), { recursive: true });
  mkdirSync(join(dir, 'sites', slug, 'content/zh'), { recursive: true });
  mkdirSync(join(dir, 'sites', slug, 'src/data'), { recursive: true });
  mkdirSync(join(dir, 'sites', slug, 'src/lib'), { recursive: true });
  mkdirSync(join(dir, 'packages/sections/src'), { recursive: true });
  writeFileSync(
    join(dir, 'packages/sections/src/registry.ts'),
    `export const sectionRegistry = {\n  hero: {},\n};\n`
  );
  writeFileSync(join(dir, 'sites', slug, 'site.config.ts'), `export const siteConfig = { siteId: '${slug}', name: 'Demo', template: '${template}' };`);
  writeFileSync(join(dir, 'sites', slug, 'wrangler.jsonc'), `{ "name": "${slug}", "vars": { "SITE_ID": "${slug}" } }`);
  writeFileSync(join(dir, 'sites', slug, 'theme.json'), JSON.stringify(REQUIRED_THEME));
  writeFileSync(join(dir, 'sites', slug, 'blueprints/home.json'), JSON.stringify({ sections: ['hero'] }));
  writeFileSync(join(dir, 'sites', slug, 'package.json'), JSON.stringify({ name: slug }));
  writeFileSync(join(dir, 'sites', slug, 'astro.config.mjs'), 'export default {};');
  writeFileSync(join(dir, 'sites', slug, 'src/lib/content.ts'), 'export {}');
  writeFileSync(join(dir, 'sites', slug, 'src/lib/sections.ts'), 'export {}');
  return join(dir, 'sites', slug);
}

const filledCommon = {
  site: { name: 'Apparel Co', title: 'Garments', description: 'Knit programs', tagline: 'Fit samples before bulk' },
  buttons: { startProject: 'Request samples', uploadFloorPlan: 'Send tech pack' },
  form: { messagePlaceholder: 'Tell us about the style' },
};
const filledHome = {
  hero: { title: 'Apparel programs', description: 'From tech pack to shipment.' },
  cta: { title: 'Send a tech pack', formTitle: 'Request garment samples' },
  rooms: { basePath: '/styles', items: [{ label: 'Knit tops', slug: 'knit-tops' }] },
  audiences: { items: [{ title: 'Brands', href: '/brands' }] },
  metrics: [{ value: '80+', label: 'Active styles' }],
};
const filledPages = {
  about: { heroTitle: 'About the apparel team' },
  contact: { heroTitle: 'Talk to the apparel team' },
  slugs: { brands: { title: 'For brands' } },
};
const filledNav = {
  main: [
    { id: 'styles', label: 'Styles', href: '/styles/knit-tops' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ],
};

function writeFilledContent(siteDir, { common = filledCommon, home = filledHome, pages = filledPages, nav = filledNav } = {}) {
  for (const locale of ['en', 'zh']) {
    writeFileSync(join(siteDir, `content/${locale}/common.json`), JSON.stringify(common));
    writeFileSync(join(siteDir, `content/${locale}/home.json`), JSON.stringify(home));
    writeFileSync(join(siteDir, `content/${locale}/pages.json`), JSON.stringify(pages));
    writeFileSync(join(siteDir, `content/${locale}/navigation.json`), JSON.stringify(nav));
  }
  writeFileSync(
    join(siteDir, 'src/data/slugs.ts'),
    `export const styleSlugs = ['knit-tops'];\nexport const pageSlugs = ['brands'];\n`
  );
  writeFileSync(
    join(siteDir, 'src/lib/slug-page.ts'),
    `for (const slug of pageSlugs) {
  paths.push({ params: { slug }, props: { type: 'page', slug } });
}
for (const slug of styleSlugs) {
  paths.push({ params: { slug: \`styles/\${slug}\` }, props: { type: 'style', slug } });
}
`
  );
}

describe('validateSite', () => {
  it('errors on dead navigation links instead of warning', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-cli-validate-'));
    const siteDir = writeSite(root);
    writeFilledContent(siteDir, {
      nav: { main: [{ id: 'fabrics', label: 'Fabrics', href: '/fabrics/cotton' }] },
    });

    const result = validateSite('demo-site', root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('/fabrics/cotton') && e.includes('no generated route')));
    assert.equal(result.warnings.length, 0);
  });

  it('errors when copy still matches the template source site', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-cli-leak-'));
    writeSite(root, { slug: 'textile-fabric', template: 'b2b-textile' });
    writeFilledContent(join(root, 'sites/textile-fabric'), {
      common: {
        ...filledCommon,
        site: { ...filledCommon.site, tagline: 'Composition, weight and color' },
      },
      home: { ...filledHome, hero: { title: 'Woven fabrics', description: 'Lab dips first' } },
    });
    writeSite(root, { slug: 'textile-apparel', template: 'b2b-textile' });
    writeFilledContent(join(root, 'sites/textile-apparel'), {
      common: {
        ...filledCommon,
        site: { ...filledCommon.site, tagline: 'Composition, weight and color' },
      },
      home: { ...filledHome, hero: { title: 'Woven fabrics', description: 'Lab dips first' } },
    });

    const result = validateSite('textile-apparel', root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('still matches source site textile-fabric')));
  });

  it('errors when copy defines the site by negating another site or category', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-cli-contrast-'));
    const siteDir = writeSite(root);
    writeFilledContent(siteDir, {
      home: {
        ...filledHome,
        audiences: {
          title: 'Built for apparel buyers, not fabric traders.',
          items: [{ title: 'Brands', href: '/brands' }],
        },
      },
    });

    const result = validateSite('demo-site', root);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('negating another site or category')));
  });
});

describe('createSite', () => {
  it('does not copy source-site prose into the new site', () => {
    const root = getWorkspaceRoot();
    const slug = `tmp-cli-${Date.now()}`;
    const created = createSite({
      slug,
      templateId: 'b2b-textile',
      name: 'Tmp Apparel',
      root,
    });

    try {
      const home = JSON.parse(readFileSync(join(created.path, 'content/en/home.json'), 'utf8'));
      const nav = JSON.parse(readFileSync(join(created.path, 'content/en/navigation.json'), 'utf8'));
      const slugs = readFileSync(join(created.path, 'src/data/slugs.ts'), 'utf8');
      assert.equal(home.hero.title, '');
      assert.equal(home.hero.description, '');
      assert.deepEqual(home.rooms.items, []);
      assert.deepEqual(nav.main.map((item) => item.href), ['/about', '/contact']);
      assert.doesNotMatch(slugs, /cotton/);
      assert.equal(existsSync(join(created.path, 'public/images/logo.svg')), true);
      assert.equal(existsSync(join(created.path, 'public/images/hero.jpg')), false);
    } finally {
      rmSync(created.path, { recursive: true, force: true });
    }
  });
});
