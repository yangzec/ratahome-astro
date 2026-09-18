#!/usr/bin/env node
/**
 * Pass-2 URL classifier. No network: reads homepage + sitemap you already fetched.
 * Usage:
 *   node schemas/competitor/classify-seeds.mjs \
 *     --origin https://acme.example \
 *     --home raw/home.md \
 *     --sitemap raw/sitemap.xml \
 *     --out raw/seeds.json
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROFILES = JSON.parse(readFileSync(joinProfiles(), 'utf8'));

function joinProfiles() {
  return resolve(HERE, 'industry-profiles.json');
}

const PAGE_HINTS = {
  about: [
    'about', 'about-us', 'aboutus', 'company', 'who-we-are', 'our-story', 'our-team',
    'factory', 'manufacturing', '关于', '公司', '我们', '简介', '工厂',
  ],
  contact: [
    'contact', 'enquiry', 'inquiry', 'inquire', 'enquire', 'quote', 'request-a-quote',
    'get-in-touch', 'get-a-quote', 'enquire-now', '联系', '询盘', '询价', '报价', '留言',
  ],
  category: [
    'products', 'product', 'collections', 'collection', 'categories', 'category',
    'solutions', 'shop', 'range', '产品', '系列', '分类', '解决方案', '商城',
  ],
  product: ['item', 'sku', 'detail', 'p', '详情'],
  case: [
    'projects', 'project', 'cases', 'case-study', 'portfolio', 'works', 'gallery',
    '案例', '项目', '作品',
  ],
  faq: ['faq', 'faqs', 'help', '常见问题', '帮助'],
  download: ['download', 'downloads', 'catalog', 'catalogs', 'resources', '下载', '图册'],
  sample: ['sample', 'sampling', 'swatch', 'request-sample', '打样', '样品', '色卡'],
  spec: ['spec', 'specification', 'datasheet', 'gsm', '规格', '克重'],
  cert: ['cert', 'certificate', 'certification', 'oeko', 'gots', 'bsci', 'iso', '认证'],
  warranty: ['warranty', 'guarantee', '质保', '保修'],
  process: ['how-it-works', 'process', 'workflow', 'oem', 'odm', '流程'],
};

const EXCLUDE = [
  'blog', 'news', 'insights', 'article', 'articles', 'press',
  'cart', 'account', 'login', 'signin', 'signup', 'wp-admin', 'search', 'tag', 'tags',
  'privacy', 'terms', 'cookie', 'cookies', 'legal', 'gdpr',
  '新闻', '博客', '隐私', '条款',
];

export function classifySeeds({
  origin,
  homeText = '',
  homeJson = null,
  sitemapXml = '',
  industryHint = '',
}) {
  const base = normalizeOrigin(origin);
  const links = collectLinks({ base, homeText, homeJson, sitemapXml });
  const scored = links.map((link) => scoreLink(link, base));
  const industry = inferIndustry({ homeText, scored, hint: industryHint });
  const urlPatterns = inferPatterns(scored, base);
  const seeds = pickSeeds(scored, base, urlPatterns, industry);
  const coreTypes = industry.profile.coreTypes ?? [];
  const unresolved = coreTypes.filter((type) => !seeds.some((s) => s.pageType === type));

  return {
    schemaVersion: 1,
    origin: base,
    pass: 2,
    industry,
    urlPatterns,
    seeds,
    unresolved,
    policy: {
      pageBudget: false,
      samplePerPattern: true,
      skipNoise: true,
    },
    candidates: scored
      .filter((row) => row.pageType !== 'skip')
      .sort((a, b) => b.score - a.score),
  };
}

function normalizeOrigin(origin) {
  const url = new URL(origin);
  return `${url.protocol}//${url.host}`;
}

function collectLinks({ base, homeText, homeJson, sitemapXml }) {
  const byUrl = new Map();

  const add = (href, label, source) => {
    const absolute = toAbsolute(href, base);
    if (!absolute) return;
    const parsed = new URL(absolute);
    if (parsed.origin !== base) return;
    parsed.hash = '';
    const url = parsed.toString().replace(/\/$/, '') || `${base}`;
    const key = url.toLowerCase();
    const current = byUrl.get(key) ?? { url, labels: new Set(), sources: new Set(), path: parsed.pathname || '/' };
    if (label) current.labels.add(cleanLabel(label));
    current.sources.add(source);
    byUrl.set(key, current);
  };

  add(`${base}/`, 'Home', 'home');
  extractMarkdownLinks(homeText).forEach(({ href, label }) => add(href, label, 'nav'));
  extractPlainUrls(homeText).forEach((href) => add(href, '', 'home-text'));
  extractJinaLinks(homeJson).forEach(({ href, label }) => add(href, label, 'jina'));
  extractSitemapLocs(sitemapXml).forEach((href) => add(href, '', 'sitemap'));

  return [...byUrl.values()].map((row) => ({
    url: canonicalizeHome(row.url, base),
    path: new URL(canonicalizeHome(row.url, base)).pathname || '/',
    labels: [...row.labels],
    sources: [...row.sources],
  }));
}

function canonicalizeHome(url, base) {
  const parsed = new URL(url);
  if (['/', '/index', '/index.html', '/home', '/en', '/zh'].includes(parsed.pathname)) {
    return `${base}/`;
  }
  return url;
}

function toAbsolute(href, base) {
  if (!href) return null;
  const trimmed = href.trim().split(/\s+/)[0].replace(/[)>,]+$/, '');
  if (!trimmed || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') || trimmed.startsWith('javascript:')) {
    return null;
  }
  try {
    return new URL(trimmed, `${base}/`).toString();
  } catch {
    return null;
  }
}

function cleanLabel(label) {
  return label.replace(/\s+/g, ' ').trim();
}

function extractMarkdownLinks(text) {
  if (!text) return [];
  const links = [];
  for (const match of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    links.push({ label: match[1], href: match[2] });
  }
  return links;
}

function extractPlainUrls(text) {
  if (!text) return [];
  return [...text.matchAll(/https?:\/\/[^\s)"']+/g)].map((match) => match[0]);
}

function extractJinaLinks(homeJson) {
  if (!homeJson) return [];
  const links = [];
  const data = homeJson.data ?? homeJson;
  const raw = data.links ?? homeJson.links;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') links.push({ href: item, label: '' });
      else if (item?.url) links.push({ href: item.url, label: item.text ?? item.title ?? '' });
    }
  } else if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string') links.push({ href: value, label: String(key) });
      else if (value?.url) links.push({ href: value.url, label: value.text ?? key });
    }
  }
  if (typeof data.content === 'string') {
    extractMarkdownLinks(data.content).forEach((row) => links.push(row));
  }
  return links;
}

function extractSitemapLocs(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"');
}

function scoreLink(link, base) {
  const haystack = `${link.path} ${link.labels.join(' ')}`.toLowerCase();
  if (isHome(link.path)) {
    return { ...link, pageType: 'home', score: 10, evidence: ['path is site root'] };
  }
  if (EXCLUDE.some((token) => containsToken(haystack, token))) {
    return { ...link, pageType: 'skip', score: 0, evidence: ['excluded path or label'] };
  }

  const scores = {};
  const evidence = [];
  for (const [pageType, tokens] of Object.entries(PAGE_HINTS)) {
    let score = 0;
    for (const token of tokens) {
      if (link.labels.some((label) => containsToken(label.toLowerCase(), token))) {
        score += 3;
        evidence.push(`label~${token}→${pageType}`);
      } else if (containsToken(link.path.toLowerCase(), token)) {
        score += 2;
        evidence.push(`path~${token}→${pageType}`);
      }
    }
    if (!score) continue;
    if (link.sources.includes('nav') || link.sources.includes('jina')) score += 1;
    if (pageType === 'category' && depth(link.path) === 1) score += 1;
    if (pageType === 'product' && depth(link.path) >= 2) score += 1;
    if (pageType === 'download' && /\/(catalogs?|downloads?)$/i.test(link.path)) score += 2;
    scores[pageType] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    if (a[0] === 'download' && /\/(catalogs?|downloads?)$/i.test(link.path)) return -1;
    if (b[0] === 'download' && /\/(catalogs?|downloads?)$/i.test(link.path)) return 1;
    return 0;
  });
  if (!ranked.length) {
    return { ...link, pageType: 'other', score: 0, evidence: ['no pageType hint'] };
  }
  const [pageType, score] = ranked[0];
  return { ...link, pageType, score, evidence: evidence.filter((item) => item.endsWith(`→${pageType}`)), origin: base };
}

function isHome(path) {
  return ['/', '/index', '/index.html', '/home', '/en', '/zh'].includes(path.replace(/\/$/, '') || '/');
}

function containsToken(haystack, token) {
  const needle = token.toLowerCase();
  const normalized = haystack.toLowerCase().replace(/[\s_]+/g, '-');
  if (/^[\u4e00-\u9fff]+$/.test(token)) return haystack.includes(needle);
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:$|[^a-z0-9])`).test(normalized);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function depth(path) {
  return path.split('/').filter(Boolean).length;
}

function inferIndustry({ homeText, scored, hint = '' }) {
  const profiles = Object.fromEntries(
    Object.entries(PROFILES).filter(([key]) => key !== 'schemaVersion' && key !== 'description'),
  );
  if (hint && profiles[hint]) {
    return { id: hint, confidence: 1, evidence: [`cli --industry ${hint}`], profile: profiles[hint] };
  }
  const hay = `${homeText} ${scored.flatMap((row) => [row.path, ...row.labels]).join(' ')}`;
  const ranked = Object.entries(profiles)
    .filter(([id]) => id !== 'unknown')
    .map(([id, profile]) => {
      const hits = (profile.signals ?? []).filter((signal) => containsToken(hay, signal) || hay.toLowerCase().includes(signal.toLowerCase()));
      return { id, profile, hits, score: hits.length };
    })
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score === 0) {
    return { id: 'unknown', confidence: 0, evidence: [], profile: profiles.unknown };
  }
  return {
    id: best.id,
    confidence: Math.min(1, best.score / 3),
    evidence: best.hits.slice(0, 6),
    profile: best.profile,
  };
}

function inferPatterns(scored, base) {
  const groups = new Map();
  for (const row of scored) {
    if (row.pageType === 'skip' || isHome(row.path)) continue;
    const first = row.path.split('/').filter(Boolean)[0];
    if (!first) continue;
    const list = groups.get(first) ?? [];
    list.push(row);
    groups.set(first, list);
  }

  const patterns = [];
  for (const [segment, rows] of groups) {
    const children = rows.filter((row) => depth(row.path) >= 2);
    const listing = rows.find((row) => depth(row.path) === 1);
    if (children.length >= 2) {
      patterns.push({
        pattern: `/${segment}/{slug}`,
        pageType: 'product',
        slugList: 'collectionSlugs',
        examples: children.slice(0, 4).map((row) => row.path),
      });
      if (listing) {
        patterns.push({
          pattern: `/${segment}`,
          pageType: 'category',
          examples: [listing.path],
        });
      }
    }
  }
  patterns.unshift({ pattern: '/', pageType: 'home', examples: [`${base}/`] });
  return patterns;
}

function pickSeeds(scored, base, urlPatterns, industry) {
  const usable = scored.filter((row) => row.pageType !== 'skip');
  const seeds = [];
  const used = new Set();
  const take = (row, pageType, reason) => {
    if (!row || used.has(row.url)) return;
    used.add(row.url);
    seeds.push({
      pageType,
      url: row.url,
      path: row.path,
      confidence: Math.min(1, (row.score ?? 8) / 8),
      evidence: [...(row.evidence ?? []), reason].filter(Boolean),
      labels: row.labels,
    });
  };

  take({ url: `${base}/`, path: '/', score: 10, evidence: ['pass-1 homepage'], labels: ['Home'] }, 'home', 'site root');

  const singletonTypes = [
    'about',
    'contact',
    'case',
    'faq',
    'download',
    'sample',
    'spec',
    'cert',
    'warranty',
    'process',
  ];
  const preferred = new Set([
    ...(industry.profile.coreTypes ?? []),
    ...(industry.profile.characteristicTypes ?? []),
  ]);
  for (const type of singletonTypes) {
    const matches = usable
      .filter((row) => row.pageType === type)
      .sort((a, b) => b.score - a.score || depth(a.path) - depth(b.path));
    if (!matches.length) continue;
    take(matches[0], type, preferred.has(type) ? `industry:${industry.id}` : 'present-on-site');
    if (type === 'download' || type === 'category') {
      matches.slice(1).forEach((row) => take(row, type, 'additional-listing'));
    }
  }

  const groups = new Map();
  for (const row of usable) {
    if (isHome(row.path) || used.has(row.url)) continue;
    const first = row.path.split('/').filter(Boolean)[0];
    if (!first) continue;
    const list = groups.get(first) ?? [];
    list.push(row);
    groups.set(first, list);
  }

  for (const [, rows] of groups) {
    const listing = rows.find((row) => depth(row.path) === 1);
    const children = rows.filter((row) => depth(row.path) >= 2);
    if (listing && (listing.pageType === 'category' || children.length >= 2)) {
      take(listing, 'category', `pattern /${listing.path.split('/').filter(Boolean)[0]}`);
    }
    const sampleCount = children.length >= 8 ? 3 : children.length >= 2 ? 2 : children.length;
    children
      .sort((a, b) => b.score - a.score)
      .slice(0, sampleCount)
      .forEach((row) => take(row, 'product', `sample ${children.length} in cluster`));
  }

  return dedupeSeeds(seeds);
}

function dedupeSeeds(seeds) {
  const seen = new Set();
  return seeds.filter((row) => {
    const key = `${row.pageType}:${row.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function loadHome(path) {
  if (!path) return { homeText: '', homeJson: null };
  const raw = readFileSync(path, 'utf8');
  if (path.endsWith('.json')) {
    const homeJson = JSON.parse(raw);
    const data = homeJson.data ?? homeJson;
    return { homeJson, homeText: data.content ?? data.markdown ?? raw };
  }
  return { homeText: raw, homeJson: null };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.origin || !args.home) {
    console.error('Need --origin and --home. Optional: --sitemap --out --industry');
    process.exit(1);
  }
  const { homeText, homeJson } = loadHome(resolve(args.home));
  const sitemapXml = args.sitemap ? readFileSync(resolve(args.sitemap), 'utf8') : '';
  const result = classifySeeds({
    origin: args.origin,
    homeText,
    homeJson,
    sitemapXml,
    industryHint: args.industry ?? '',
  });
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (args.out) {
    const out = resolve(args.out);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, json);
  }
  process.stdout.write(json);
  if (result.unresolved.length) {
    console.error(`missing industry core types (not a hard fail): ${result.unresolved.join(', ')}`);
  }
}
