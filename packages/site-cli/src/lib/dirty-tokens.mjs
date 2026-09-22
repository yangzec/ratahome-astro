import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Known filled demo instances — industry nouns in their content are expected. */
export const FILLED_INDUSTRY_SITES = new Set([
  'ratahome-furniture',
  'loftknit-oem',
  'atelierbag-oem',
]);

/** Furniture / sock leftovers that must not ship in a new or unfilled site. */
const DIRTY_PATTERNS = [
  { id: 'ratahome', re: /\bratahome\b/i },
  { id: 'foshan', re: /\bfoshan\b/i },
  { id: 'sofa', re: /\bsofas?\b/i },
  { id: 'sectional', re: /\bsectionals?\b/i },
  { id: 'loftknit', re: /\bloftknit\b/i },
  { id: 'zhuji', re: /\bzhuji\b/i },
  { id: 'sock', re: /\bsocks?\b/i },
  { id: 'foshan-zh', re: /佛山/ },
  { id: 'sofa-zh', re: /沙发/ },
  { id: 'zhuji-zh', re: /诸暨/ },
  { id: 'sock-zh', re: /袜子/ },
  { id: 'furniture-zh', re: /家具/ },
];

export function findDirtyTokensInText(text, fileLabel) {
  const hits = [];
  for (const { id, re } of DIRTY_PATTERNS) {
    if (re.test(text)) {
      hits.push(`${fileLabel}: leftover token "${id}"`);
    }
  }
  return hits;
}

export function scanSiteContentDirtyTokens(siteDir) {
  const hits = [];
  for (const locale of ['en', 'zh']) {
    const localeDir = join(siteDir, 'content', locale);
    if (!existsSync(localeDir)) continue;
    for (const file of readdirSync(localeDir)) {
      if (!file.endsWith('.json')) continue;
      const rel = `content/${locale}/${file}`;
      const text = readFileSync(join(localeDir, file), 'utf8');
      hits.push(...findDirtyTokensInText(text, rel));
    }
  }
  return hits;
}
