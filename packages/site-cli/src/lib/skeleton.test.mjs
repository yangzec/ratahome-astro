import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { emptySlugArrays, skeletonNavigation, wipeCopy } from './skeleton.mjs';
import { collectGeneratedRoutes, parseSlugPathBindings, parseSlugArrays } from './routes.mjs';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('wipeCopy', () => {
  it('clears prose and catalog arrays but keeps icons and fragment CTAs', () => {
    const wiped = wipeCopy({
      hero: { title: 'Sell fabric', description: 'GSM and rolls', ctaHref: '#sample' },
      rooms: { basePath: '/fabrics', items: [{ label: 'Cotton', slug: 'cotton' }] },
      assurances: [{ icon: '/icons/clock.svg', title: 'Lab dip', description: 'Written approval' }],
    });

    assert.equal(wiped.hero.title, '');
    assert.equal(wiped.hero.description, '');
    assert.equal(wiped.hero.ctaHref, '#sample');
    assert.deepEqual(wiped.rooms.items, []);
    assert.equal(wiped.assurances[0].icon, '/icons/clock.svg');
    assert.equal(wiped.assurances[0].title, '');
  });
});

describe('emptySlugArrays', () => {
  it('keeps export names and empties every slug list', () => {
    const next = emptySlugArrays(`export const fabricSlugs = [
  'cotton',
  'linen',
];

export const collectionSlugs: string[] = [];
export const pageSlugs = [
  'brands',
  'traders',
];
`);
    assert.match(next, /export const fabricSlugs = \[\];/);
    assert.match(next, /export const collectionSlugs: string\[\] = \[\];/);
    assert.match(next, /export const pageSlugs = \[\];/);
    assert.doesNotMatch(next, /cotton/);
  });
});

describe('skeletonNavigation', () => {
  it('only keeps about and contact routes', () => {
    const nav = skeletonNavigation();
    assert.deepEqual(
      nav.main.map((item) => item.href),
      ['/about', '/contact']
    );
  });
});

describe('collectGeneratedRoutes', () => {
  it('builds routes from slugs.ts and slug-page.ts prefixes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'site-cli-routes-'));
    mkdirSync(join(dir, 'content/en'), { recursive: true });
    mkdirSync(join(dir, 'src/data'), { recursive: true });
    mkdirSync(join(dir, 'src/lib'), { recursive: true });
    writeFileSync(join(dir, 'content/en/pages.json'), JSON.stringify({ slugs: { brands: {} } }));
    writeFileSync(
      join(dir, 'src/data/slugs.ts'),
      `export const fabricSlugs = ['cotton'];
export const pageSlugs = ['brands', 'sampling'];
`
    );
    writeFileSync(
      join(dir, 'src/lib/slug-page.ts'),
      `for (const slug of pageSlugs) {
  paths.push({ params: { slug }, props: { type: 'page', slug } });
}
for (const slug of fabricSlugs) {
  paths.push({ params: { slug: \`fabrics/\${slug}\` }, props: { type: 'fabric', slug } });
}
`
    );

    const routes = collectGeneratedRoutes(dir);
    assert.ok(routes.has('about'));
    assert.ok(routes.has('brands'));
    assert.ok(routes.has('sampling'));
    assert.ok(routes.has('fabrics'));
    assert.ok(routes.has('fabrics/cotton'));
    assert.equal(routes.has('fabrics/linen'), false);
    assert.equal(routes.has('styles/cotton'), false);
  });
});

describe('parseSlugPathBindings', () => {
  it('reads prefixes from getSlugStaticPaths', () => {
    const bindings = parseSlugPathBindings(`
  for (const slug of pageSlugs) {
    paths.push({ params: { slug }, props: { type: 'page', slug } });
  }
  for (const slug of styleSlugs) {
    paths.push({ params: { slug: \`styles/\${slug}\` }, props: { type: 'style', slug } });
  }
`);
    assert.deepEqual(bindings, [
      { arrayName: 'pageSlugs', prefix: null },
      { arrayName: 'styleSlugs', prefix: 'styles' },
    ]);
    assert.deepEqual(parseSlugArrays(`export const styleSlugs = ['knit-tops'];`), {
      styleSlugs: ['knit-tops'],
    });
  });
});
