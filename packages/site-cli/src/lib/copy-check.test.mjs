import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ACTION_THRESHOLD,
  REVIEW_THRESHOLD,
  SEVERITY_ELEVATE,
  checkCopy,
  checkCopyLayerA,
  layerBQuestions,
  resolveValidateTargets,
  routeLayerBAnswers,
  routeNoul,
} from './copy-check.mjs';

function writeCopySite(dir, {
  slug = 'textile-fabric',
  siteId = 'textile-fabric',
  sections = ['hero-fullbleed', 'audience-cards'],
  home = {
    hero: { title: 'Woven fabrics', description: 'Lab dips, GSM and MOQ in writing.' },
    audiences: { title: 'Brands and traders', description: 'Composition and lab dip docs.' },
  },
  extraEn = {},
} = {}) {
  mkdirSync(join(dir, 'sites', slug, 'blueprints'), { recursive: true });
  mkdirSync(join(dir, 'sites', slug, 'content/en'), { recursive: true });
  mkdirSync(join(dir, 'sites', slug, 'content/zh'), { recursive: true });
  writeFileSync(
    join(dir, 'sites', slug, 'site.config.ts'),
    `export const siteConfig = { siteId: '${siteId}', name: 'Demo', template: 'b2b-textile' };`
  );
  writeFileSync(join(dir, 'sites', slug, 'blueprints/home.json'), JSON.stringify({ sections }));
  writeFileSync(join(dir, 'sites', slug, 'content/en/home.json'), JSON.stringify(home));
  writeFileSync(join(dir, 'sites', slug, 'content/zh/home.json'), JSON.stringify(home));
  for (const [file, data] of Object.entries(extraEn)) {
    writeFileSync(join(dir, 'sites', slug, `content/en/${file}`), JSON.stringify(data));
  }
  return slug;
}

describe('checkCopyLayerA', () => {
  it('blocks CJK in en locale strings', async () => {
    const root = mkdtempSync(join(tmpdir(), 'copy-cjk-'));
    const slug = writeCopySite(root, {
      home: {
        hero: { title: '面料站草稿', description: 'Lab dips first' },
        audiences: { title: 'Brands', description: 'Traders' },
      },
    });

    const result = await checkCopy(slug, { root, apiKey: '' });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('CJK characters in en locale')));
    assert.equal(result.layerB, 'skipped');
  });

  it('blocks placeholder and internal tokens', async () => {
    const root = mkdtempSync(join(tmpdir(), 'copy-token-'));
    const slug = writeCopySite(root, {
      extraEn: { 'common.json': { site: { tagline: 'TODO replace this lorem ipsum' } } },
    });

    const result = await checkCopy(slug, { root, apiKey: '' });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('internal token "TODO"')));
    assert.ok(result.errors.some((e) => e.includes('internal token "lorem ipsum"')));
  });

  it('blocks unknown blueprint section ids and missing home.json keys', () => {
    const layerA = checkCopyLayerA({
      slug: 'textile-fabric',
      siteId: 'textile-fabric',
      blueprint: { sections: ['hero-fullbleed', 'not-a-section'] },
      content: {
        'en/home.json': { hero: { title: 'Fabrics' } },
        'zh/home.json': { hero: { title: '面料' } },
      },
    });

    assert.ok(layerA.errors.some((e) => e.includes('unknown section "not-a-section"')));
    assert.equal(layerA.errors.some((e) => e.includes('missing key "audiences"')), false);
    const missing = checkCopyLayerA({
      slug: 'textile-fabric',
      siteId: 'textile-fabric',
      blueprint: { sections: ['audience-cards'] },
      content: { 'en/home.json': { hero: { title: 'Fabrics' } } },
    });
    assert.ok(missing.errors.some((e) => e.includes('missing key "audiences"')));
  });

  it('does not flag OEKO-TEX, MOQ, PP, lab dip, GSM or BSCI', async () => {
    const root = mkdtempSync(join(tmpdir(), 'copy-terms-'));
    const slug = writeCopySite(root, {
      home: {
        hero: {
          title: 'OEKO-TEX and GOTS mills',
          description: 'MOQ, PP, lab dip, GSM and BSCI pack on request.',
        },
        audiences: { title: 'Brands', description: 'AQL and lab dip before bulk.' },
      },
    });

    const result = await checkCopy(slug, { root, apiKey: '' });
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });
});

describe('Layer B routing', () => {
  it('passes below review, reviews mid band, blocks at action', () => {
    assert.equal(routeNoul(0.2), 'pass');
    assert.equal(routeNoul(REVIEW_THRESHOLD), 'review');
    assert.equal(routeNoul(0.69), 'review');
    assert.equal(routeNoul(ACTION_THRESHOLD), 'block');
  });

  it('elevates review to block when severity >= 2.0', () => {
    assert.equal(routeNoul(0.4, SEVERITY_ELEVATE), 'block');
    assert.equal(routeNoul(0.4, 1.9), 'review');
  });

  it('blocks when any hazard is at action threshold', () => {
    const routed = routeLayerBAnswers({
      section_mismatch: { noul: 0.1 },
      generic_boilerplate: { noul: 0.72 },
      over_explaining: { noul: 0.05 },
      industry_fit: { noul: 0.02 },
      severity: { score: 1.1 },
    });
    assert.equal(routed.verdict, 'block');
  });
});

describe('checkCopy Layer B', () => {
  it('warns and skips Layer B when the API key is unset', async () => {
    const root = mkdtempSync(join(tmpdir(), 'copy-nokey-'));
    const slug = writeCopySite(root);
    const result = await checkCopy(slug, { root, apiKey: '' });
    assert.equal(result.layerB, 'skipped');
    assert.ok(result.warnings.some((w) => w.includes('TYPESAFE_API_KEY unset')));
  });

  it('blocks when Jev returns an action-threshold hazard', async () => {
    const root = mkdtempSync(join(tmpdir(), 'copy-jev-'));
    const slug = writeCopySite(root);
    const calls = [];
    const fetchFn = async (_url, init) => {
      calls.push(JSON.parse(init.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          model: 'jev-latest',
          answers: {
            section_mismatch: { type: 'noul', noul: 0.12 },
            generic_boilerplate: { type: 'noul', noul: 0.81 },
            over_explaining: { type: 'noul', noul: 0.08 },
            industry_fit: { type: 'noul', noul: 0.04 },
            severity: { type: 'score', score: 1.4 },
          },
        }),
      };
    };

    const result = await checkCopy(slug, { root, apiKey: 'ts_test', fetchFn });
    assert.equal(result.layerB, 'ran');
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('Layer B block') && e.includes('generic_boilerplate=0.81')));
    assert.ok(calls.length >= 1);
    assert.deepEqual(Object.keys(calls[0].questions).sort(), [
      'generic_boilerplate',
      'industry_fit',
      'over_explaining',
      'section_mismatch',
      'severity',
    ]);
    assert.equal('internal_voice' in calls[0].questions, false);
  });

  it('prints review warnings and still exits ok', async () => {
    const root = mkdtempSync(join(tmpdir(), 'copy-review-'));
    const slug = writeCopySite(root);
    const fetchFn = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        answers: {
          section_mismatch: { noul: 0.1 },
          generic_boilerplate: { noul: 0.4 },
          over_explaining: { noul: 0.05 },
          industry_fit: { noul: 0.02 },
          severity: { score: 1.0 },
        },
      }),
    });

    const result = await checkCopy(slug, { root, apiKey: 'ts_test', fetchFn });
    assert.equal(result.ok, true);
    assert.ok(result.warnings.some((w) => w.includes('Layer B review')));
  });

  it('treats TypeSafe HTTP failures as warnings, not blocks', async () => {
    const root = mkdtempSync(join(tmpdir(), 'copy-http-'));
    const slug = writeCopySite(root);
    const fetchFn = async () => ({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    });

    const result = await checkCopy(slug, { root, apiKey: 'ts_bad', fetchFn });
    assert.equal(result.ok, true);
    assert.ok(result.warnings.some((w) => w.includes('Layer B skipped') && w.includes('401')));
  });
});

describe('layerBQuestions', () => {
  it('does not ask internal_voice and keeps industry terms out of auto-fail language', () => {
    const questions = layerBQuestions({
      sectionId: 'assurance-bar',
      contentKey: 'assurances',
      role: { job: 'Trust chips', should: 'Certs', shouldNot: 'Slogans' },
      profile: { sells: 'Fabrics', buyers: 'Brands' },
    });
    assert.equal(questions.internal_voice, undefined);
    assert.match(JSON.stringify(questions), /OEKO-TEX/);
    assert.match(JSON.stringify(questions), /lab dip/);
  });
});

describe('resolveValidateTargets', () => {
  const slugs = ['ratahome-furniture', 'textile-apparel', 'textile-fabric', 'textile-home'];

  it('validates only changed sites', () => {
    const result = resolveValidateTargets(
      ['sites/textile-fabric/content/en/home.json', 'README.md'],
      slugs
    );
    assert.deepEqual(result.slugs, ['textile-fabric']);
  });

  it('validates all sites when site-cli changes', () => {
    const result = resolveValidateTargets(['packages/site-cli/src/lib/copy-check.mjs'], slugs);
    assert.deepEqual(result.slugs, slugs);
  });

  it('skips when only unrelated files change', () => {
    const result = resolveValidateTargets(['README.md'], slugs);
    assert.deepEqual(result.slugs, []);
  });
});
