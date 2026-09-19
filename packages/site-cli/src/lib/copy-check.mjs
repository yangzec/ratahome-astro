import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assertSiteExists, getWorkspaceRoot } from './paths.mjs';

/** Blueprint section id → home.json content key. Unknown ids are Layer A blocks. */
export const SECTION_MAP = {
  'hero-fullbleed': 'hero',
  'assurance-bar': 'assurances',
  'metrics-bar': 'metrics',
  'audience-cards': 'audiences',
  'capabilities-grid': 'capabilities',
  'process-timeline': 'process',
  'rooms-grid': 'rooms',
  testimonials: 'testimonials',
  'warranty-cases': 'warranty',
  'contact-cta': 'cta',
  'projects-showcase': 'projects',
  ecosystem: 'ecosystem',
};

export const INDUSTRY_PROFILES = {
  'textile-apparel': {
    sells: 'Knit and woven garment OEM/ODM',
    buyers: 'Brands, retailers, agents, product developers',
    context: 'Cut-and-sew in Shaoxing, Guangzhou and similar CMT clusters',
    buyer_questions: 'Pattern, grading, PP sample, bulk, export packing',
  },
  'textile-fabric': {
    sells: 'Woven and knit fabrics',
    buyers: 'Brands, manufacturers, traders, product developers',
    context: 'Mills in Shaoxing, Guangzhou and similar weaving clusters',
    buyer_questions: 'Composition, GSM, color cards, MOQ, lead time, shipment',
  },
  'textile-home': {
    sells: 'Hotel bedding, terry towels, curtains and related home textiles',
    buyers: 'Hotels, retailers, developers, product developers',
    context: 'Home-textile workshops in Nantong, Guangzhou and similar clusters',
    buyer_questions: 'Room grade, GSM, sizes, embroidery, set packing',
  },
  'ratahome-furniture': {
    sells: 'Residential interiors: furniture, cabinetry, lighting and materials as one project',
    buyers: 'Homeowners, interior designers, builders/developers, hospitality',
    context: 'Foshan manufacturing and export packing for overseas homes and projects',
    buyer_questions: 'Whole-home scope, floor plan, lead time, warranty, inspection',
  },
};

export const SECTION_ROLES = {
  'hero-fullbleed': {
    job: 'In 3 seconds say who you are, what you make, and for whom.',
    should: 'Category + service form + one concrete anchor (origin or delivery).',
    shouldNot: 'Universal "one partner for everything"; lifestyle prose; supply-chain philosophy.',
  },
  'assurance-bar': {
    job: 'Checkable promises (inspection, lead-time response, packing, after-sales), one fact each.',
    should: 'Industry-verifiable items (PP/needle count; colorfastness/lot shade; GSM/shrinkage; furniture structural warranty).',
    shouldNot: 'Empty trusted/premium/world-class with no object; slogans as assurances.',
  },
  'metrics-bar': {
    job: 'Scannable numeric social proof buyers use to decide.',
    should: 'Lead time, capacity, export markets, inspection rate, MOQ, spec range.',
    shouldNot: 'Metrics copied from another industry; unverifiable vanity numbers.',
  },
  'audience-cards': {
    job: 'Split by buyer role, not a product-line brochure.',
    should: 'Each card: role name + the result that role actually wants, in one sentence.',
    shouldNot: 'Furniture "Solutions for every project" on a textile site; four identical cards; consumer dream-home voice.',
  },
  'capabilities-grid': {
    job: 'Capability list a buyer names in the first RFQ.',
    should: 'Industry verbs/nouns (grading, lab dip, embroidery, set packing, cabinetry).',
    shouldNot: 'Process steps stuffed into capability cells; over-explaining "why one team".',
  },
  'process-timeline': {
    job: 'Inquiry to shipment, one action per step.',
    should: 'Industry step names (quote → sample → approval → bulk → inspect/ship), tuned per site.',
    shouldNot: 'Furniture Discover/Design/Curate copied onto textile with no textile meaning; essays per step.',
  },
  'rooms-grid': {
    job: 'Catalog navigation. Textile: product/scene families. Furniture: rooms is valid.',
    should: 'Apparel: garment types. Fabric: constructions/uses. Home textile: bedding/terry/hotel scenes in procurement language. Furniture: rooms.',
    shouldNot: 'Living Room / Dining Room furniture room list on a textile site; "Explore the home by room" on fabric/apparel/home-textile.',
  },
  testimonials: {
    job: 'Someone else\'s result proof: short quote + identity.',
    should: 'A concrete industry result (lead time, quality, communication).',
    shouldNot: 'Form-CTA voice; internal project nicknames; generic praise.',
  },
  'warranty-cases': {
    job: 'What happens when something goes wrong — Q&A commitments.',
    should: 'Industry risks (shade lot, shrinkage, needle holes, embroidery error, short pack; furniture transit/structure).',
    shouldNot: 'Furniture "3-year structural warranty" copied onto textile; legal essays.',
  },
  'contact-cta': {
    job: 'Next action (send specs / lab-dip needs / room list), not another brand story.',
    should: 'What to submit (tech pack, composition, room count).',
    shouldNot: '"Send your floor plan" on a textile site; guaranteed-deal language.',
  },
  'projects-showcase': {
    job: 'Comparable projects: place, volume, cycle, what was solved.',
    should: 'Results with numbers.',
    shouldNot: 'Adjectives only.',
  },
  ecosystem: {
    job: 'Production / location backing if the section is on the blueprint.',
    should: 'Capability + geographic split.',
    shouldNot: 'A second capabilities grid.',
  },
};

export const REVIEW_THRESHOLD = 0.35;
export const ACTION_THRESHOLD = 0.7;
export const SEVERITY_ELEVATE = 2.0;

export const TYPESAFE_SYSTEM_ONE_URL = 'https://api.typesafe.ai/v1/systemone';

const ASSET_KEYS = new Set(['image', 'icon', 'href', 'ctaHref', 'slug', 'basePath', 'step']);

const CJK_RE = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;

const INTERNAL_TOKENS = [
  { id: 'TODO', re: /\bTODO\b/i },
  { id: 'FIXME', re: /\bFIXME\b/i },
  { id: 'TBD', re: /\bTBD\b/i },
  { id: '待确认', re: /待确认/ },
  { id: '内部备注', re: /内部备注/ },
  { id: '复刻站', re: /复刻站/ },
  { id: 'site_id', re: /\bsite_id\b/ },
  { id: '老杨', re: /老杨/ },
  { id: 'AGENTS.md', re: /\bAGENTS\.md\b/ },
  { id: 'NOT SENT', re: /\bNOT SENT\b/i },
  { id: 'lorem ipsum', re: /\blorem\s+ipsum\b/i },
];

const SHARED_VALIDATE_PREFIXES = [
  'packages/site-cli/',
  'packages/sections/',
  'packages/core/',
  '.github/workflows/copy-validate.yml',
  'docs/COPY_SECTION_STANDARD.md',
];

const HAZARD_NOULS = ['section_mismatch', 'generic_boilerplate', 'over_explaining', 'industry_fit'];

export function loadSiteCopyContext(slug, root = getWorkspaceRoot()) {
  const siteDir = assertSiteExists(slug, root);
  let siteId = slug;
  try {
    const configRaw = readFileSync(join(siteDir, 'site.config.ts'), 'utf8');
    siteId = configRaw.match(/siteId:\s*'([^']+)'/)?.[1] ?? slug;
  } catch {
    // Layer A still runs against files we can read.
  }

  let blueprint;
  try {
    blueprint = JSON.parse(readFileSync(join(siteDir, 'blueprints/home.json'), 'utf8'));
  } catch (e) {
    blueprint = { sections: [], error: e.message };
  }

  const content = {};
  for (const locale of ['en', 'zh']) {
    const localeDir = join(siteDir, 'content', locale);
    if (!existsSync(localeDir)) continue;
    for (const file of readdirSync(localeDir)) {
      if (!file.endsWith('.json')) continue;
      const rel = `${locale}/${file}`;
      try {
        content[rel] = JSON.parse(readFileSync(join(localeDir, file), 'utf8'));
      } catch (e) {
        content[rel] = { __parseError: e.message };
      }
    }
  }

  return { slug, siteId, siteDir, blueprint, content };
}

export function checkCopyLayerA({ slug, siteId, blueprint, content }) {
  const errors = [];
  const profileId = resolveProfileId(siteId, slug);

  const sections = Array.isArray(blueprint?.sections) ? blueprint.sections : [];
  if (blueprint?.error) {
    errors.push(`blueprints/home.json: ${blueprint.error}`);
  }

  for (const id of sections) {
    if (!SECTION_MAP[id]) {
      errors.push(`blueprints/home.json: unknown section "${id}" (not in SECTION_MAP)`);
      continue;
    }
    const key = SECTION_MAP[id];
    for (const locale of ['en', 'zh']) {
      const home = content[`${locale}/home.json`];
      if (!home || home.__parseError) continue;
      if (home[key] == null) {
        errors.push(
          `content/${locale}/home.json: missing key "${key}" required by blueprint section "${id}"`
        );
      }
    }
  }

  for (const [fileKey, data] of Object.entries(content)) {
    if (data?.__parseError) {
      errors.push(`content/${fileKey}: invalid JSON — ${data.__parseError}`);
      continue;
    }
    const locale = fileKey.split('/')[0];
    walkStrings(data, `content/${fileKey}`, (text, path) => {
      if (locale === 'en' && CJK_RE.test(text)) {
        errors.push(`${path}: CJK characters in en locale — "${truncate(text)}"`);
      }
      for (const token of INTERNAL_TOKENS) {
        if (token.re.test(text)) {
          errors.push(`${path}: internal token "${token.id}" — "${truncate(text)}"`);
        }
      }
    });
  }

  return { errors, profileId };
}

export function routeLayerBAnswers(answers) {
  const severity = Number(answers?.severity?.score ?? 0);
  const hazards = {};
  let verdict = 'pass';

  for (const name of HAZARD_NOULS) {
    const noul = Number(answers?.[name]?.noul ?? 0);
    hazards[name] = noul;
    const level = routeNoul(noul, severity);
    if (level === 'block') verdict = 'block';
    else if (level === 'review' && verdict !== 'block') verdict = 'review';
  }

  return { verdict, hazards, severity };
}

export function routeNoul(noul, severity = 0) {
  if (noul >= ACTION_THRESHOLD) return 'block';
  if (noul >= REVIEW_THRESHOLD) {
    return severity >= SEVERITY_ELEVATE ? 'block' : 'review';
  }
  return 'pass';
}

export function resolveValidateTargets(changedFiles, allSlugs) {
  const files = (changedFiles ?? []).filter(Boolean);
  if (files.some((file) => SHARED_VALIDATE_PREFIXES.some((prefix) => file.startsWith(prefix)))) {
    return { slugs: [...allSlugs], reason: 'shared validator or platform files changed' };
  }
  const slugs = [...new Set(
    files
      .filter((file) => file.startsWith('sites/'))
      .map((file) => file.split('/')[1])
      .filter((slug) => allSlugs.includes(slug))
  )].sort();
  if (slugs.length) return { slugs, reason: 'changed sites' };
  return { slugs: [], reason: 'no site or validator changes' };
}

export function layerBQuestions({ sectionId, contentKey, role, profile }) {
  const roomsNote = sectionId === 'rooms-grid'
    ? ' On furniture sites, room navigation is valid. On textile-apparel / textile-fabric / textile-home, rooms-grid is product or procurement-scene navigation, not residential rooms.'
    : '';

  return {
    section_mismatch: {
      type: 'noul',
      instructions:
        `The visitor copy in \`copy\` does not do the job of homepage section \`${sectionId}\` (content key \`${contentKey}\`). Required job: ${role.job} Should include: ${role.should} Must not: ${role.shouldNot}${roomsNote} True only if the copy is doing another section's job.`,
      criteria: {
        true: 'Copy is assigned to the wrong section job.',
        false: 'Copy matches this section. Industry terms such as OEKO-TEX, GOTS, BSCI, MOQ, PP, lab dip, GSM and AQL are valid and are not a mismatch.',
      },
    },
    generic_boilerplate: {
      type: 'noul',
      instructions:
        'The copy in `copy` is generic cross-industry boilerplate, or a furniture-site sentence with only the product noun swapped. True for shared skeletons like "Programs for every buyer in the chain", "Solutions by buyer type", or "one partner for everything" used without industry meaning.',
      criteria: {
        true: 'Template voice or furniture-to-textile swap.',
        false: 'Specific to this industry. Spec language is not boilerplate.',
      },
    },
    over_explaining: {
      type: 'noul',
      instructions:
        'The copy in `copy` over-explains: long "Instead of… you work with… turning X into Y" causality, the description restates the title, or it teaches buyers obvious trade terms (what OEM or GSM is) unless this section is educational. Short spec language is not over-explaining.',
      criteria: {
        true: 'Padded, repetitive, or teaching known terms.',
        false: 'Short and specific; title and description do different work.',
      },
    },
    industry_fit: {
      type: 'noul',
      instructions:
        `The copy in \`copy\` is a poor fit for this site's industry profile in \`industry\` (${profile.sells}; buyers: ${profile.buyers}). True if it sells the wrong category, uses leftover furniture complete-home / floor-plan language on a textile site, or treats textile terms as the only story on a furniture site. OEKO-TEX, GOTS, BSCI, MOQ, PP, lab dip, GSM and AQL must not count as poor fit.`,
      criteria: {
        true: 'Wrong industry, wrong buyer, or leftover furniture/textile collision.',
        false: 'Matches the site profile. Those industry terms are a fit, not a failure.',
      },
    },
    severity: {
      type: 'score',
      instructions:
        'How serious are the copy problems in `copy` for a B2B buyer landing on this section? Do not raise severity for valid industry terms.',
      criteria: [
        'No issue — on-role, industry-correct, concise.',
        'Minor: a bit generic or slightly long, but role and industry are correct.',
        'Serious: wrong section job, furniture/textile mix-up, or template voice that should block merge.',
        'Severe: internal leakage or unusable visitor copy.',
      ],
    },
  };
}

export async function checkCopy(slug, {
  root = getWorkspaceRoot(),
  apiKey = process.env.TYPESAFE_API_KEY,
  fetchFn = globalThis.fetch,
  model = process.env.TYPESAFE_MODEL || 'jev-latest',
  endpoint = process.env.TYPESAFE_BASE_URL
    ? `${process.env.TYPESAFE_BASE_URL.replace(/\/$/, '')}/v1/systemone`
    : TYPESAFE_SYSTEM_ONE_URL,
} = {}) {
  const ctx = loadSiteCopyContext(slug, root);
  const layerA = checkCopyLayerA(ctx);
  const errors = [...layerA.errors];
  const warnings = [];
  const findings = [];

  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key) {
    warnings.push(
      'copy-check: TYPESAFE_API_KEY unset — skipped Layer B (Jev). Layer A still ran. Set the key locally or as the CI repo secret to enable section judgments.'
    );
    return {
      slug,
      siteId: ctx.siteId,
      ok: errors.length === 0,
      errors,
      warnings,
      findings,
      layerB: 'skipped',
      profileId: layerA.profileId,
    };
  }

  const home = ctx.content['en/home.json'];
  const sections = Array.isArray(ctx.blueprint?.sections) ? ctx.blueprint.sections : [];
  const profile = INDUSTRY_PROFILES[layerA.profileId] ?? genericProfile(ctx.siteId);
  if (!INDUSTRY_PROFILES[layerA.profileId]) {
    warnings.push(
      `copy-check: no industry profile for "${ctx.siteId}" — using a generic B2B profile for Layer B`
    );
  }

  const jobs = sections
    .filter((id) => SECTION_MAP[id] && home && home[SECTION_MAP[id]] != null)
    .map((sectionId) => ({
      sectionId,
      run: async () => {
        const contentKey = SECTION_MAP[sectionId];
        const role = SECTION_ROLES[sectionId] ?? {
          job: 'Serve this homepage section only.',
          should: 'Stay on-role and industry-specific.',
          shouldNot: 'Generic boilerplate or another section\'s job.',
        };
        const state = {
          site_id: ctx.siteId,
          locale: 'en',
          industry: profile,
          section: { id: sectionId, content_key: contentKey, ...role },
          copy: stripAssets(home[contentKey]),
          notes:
            'Do not treat OEKO-TEX, GOTS, BSCI, MOQ, PP, lab dip, GSM or AQL as internal voice or poor fit. Do not invent quotes or prices. Judge only the provided copy. internal_voice is not the primary question.',
        };

        const answers = await requestSystemOne({
          fetchFn,
          endpoint,
          apiKey: key,
          model,
          state,
          questions: layerBQuestions({ sectionId, contentKey, role, profile }),
        });
        const routed = routeLayerBAnswers(answers);
        return { sectionId, contentKey, ...routed, answers };
      },
    }));

  const layerBResults = await mapPool(jobs, 4, (job) => job.run());

  for (const finding of layerBResults) {
    if (finding.error) {
      warnings.push(`copy-check Layer B skipped [${slug} / ${finding.sectionId}]: ${finding.error}`);
      continue;
    }
    findings.push(finding);
    const detail = formatFinding(finding);
    if (finding.verdict === 'block') {
      errors.push(`copy-check Layer B block [${slug} / ${finding.sectionId}]: ${detail}`);
    } else if (finding.verdict === 'review') {
      warnings.push(`copy-check Layer B review [${slug} / ${finding.sectionId}]: ${detail}`);
    }
  }

  return {
    slug,
    siteId: ctx.siteId,
    ok: errors.length === 0,
    errors,
    warnings,
    findings,
    layerB: 'ran',
    profileId: layerA.profileId,
  };
}

function formatFinding(finding) {
  const parts = HAZARD_NOULS.map((name) => `${name}=${fmtNoul(finding.hazards[name])}`);
  parts.push(`severity=${fmtNoul(finding.severity)}`);
  return parts.join(' ');
}

function fmtNoul(value) {
  return Number.isFinite(value) ? value.toFixed(2) : 'n/a';
}

async function requestSystemOne({ fetchFn, endpoint, apiKey, model, state, questions }) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, state, questions }),
      });
      if (response.status === 429 || response.status === 529 || response.status >= 500) {
        lastError = `HTTP ${response.status}`;
        await sleep(400 * 2 ** attempt);
        continue;
      }
      if (!response.ok) {
        const body = await safeText(response);
        throw new Error(`HTTP ${response.status}${body ? ` — ${truncate(body, 160)}` : ''}`);
      }
      const payload = await response.json();
      return payload.answers ?? {};
    } catch (err) {
      lastError = err.message;
      if (err.message.startsWith('HTTP ') && !err.message.startsWith('HTTP 429') && !err.message.startsWith('HTTP 529')) {
        throw err;
      }
      await sleep(400 * 2 ** attempt);
    }
  }
  throw new Error(lastError ?? 'TypeSafe request failed');
}

async function mapPool(items, limit, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      try {
        results[current] = await fn(items[current], current);
      } catch (err) {
        const sectionId = items[current]?.sectionId ?? `index-${current}`;
        results[current] = { sectionId, error: err.message, verdict: 'skipped' };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 0 }, () => worker()));
  return results;
}

function resolveProfileId(siteId, slug) {
  if (INDUSTRY_PROFILES[siteId]) return siteId;
  if (INDUSTRY_PROFILES[slug]) return slug;
  return siteId;
}

function genericProfile(siteId) {
  return {
    sells: `B2B independent-site offer for ${siteId}`,
    buyers: 'Procurement, product, and development buyers',
    context: 'Export manufacturing',
    buyer_questions: 'Specs, sampling, MOQ, lead time',
  };
}

function walkStrings(value, path, visit) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (text) visit(text, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, `${path}[${index}]`, visit));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (ASSET_KEYS.has(key)) continue;
      walkStrings(child, `${path}.${key}`, visit);
    }
  }
}

function stripAssets(value) {
  if (Array.isArray(value)) return value.map(stripAssets);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (ASSET_KEYS.has(key)) continue;
      out[key] = stripAssets(child);
    }
    return out;
  }
  return value;
}

function truncate(text, max = 72) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
