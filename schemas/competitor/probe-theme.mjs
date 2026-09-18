#!/usr/bin/env node
/**
 * Remote DevTools for theme-tokens: CF /content + addScriptTag + getComputedStyle.
 * Does not guess colors with Workers AI /json.
 *
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... \
 *   node schemas/competitor/probe-theme.mjs \
 *     --url https://example.com/ \
 *     --out raw/theme-computed.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PROBE_ID = '__theme_probe';

const DEFAULT_SELECTORS = [
  'body',
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'a.o-button',
  '.o-button .vc_general.vc_btn3',
  '.header-right .o-button .vc_general.vc_btn3',
  '.bt-header',
  '.bt-footer',
  '.footer-wraper',
  '.homeproducts-card',
  '.homeproductscard-img img',
  '.imagetext-block img',
  '.product-firstsec',
  '.product-firstsec > .vc_col-sm-12 > .vc_column-inner',
  '.pwhychoose-block > .vc_col-sm-12 > .vc_column-inner',
  '.heroslider-card',
  '.heroslider-card .heroslider-card__content h1 span',
];

const PROBE_SCRIPT = `
(function () {
  function parseColor(value) {
    const s = String(value || '');
    const m = s.match(/rgba?\\(\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*,\\s*([\\d.]+)(?:\\s*,\\s*([\\d.]+))?\\s*\\)/i);
    if (!m) return { raw: s, hex: null, rgb: null, alpha: null };
    const r = Math.round(Number(m[1]));
    const g = Math.round(Number(m[2]));
    const b = Math.round(Number(m[3]));
    const a = m[4] === undefined ? 1 : Number(m[4]);
    const hex = '#' + [r, g, b].map(function (n) {
      return n.toString(16).padStart(2, '0');
    }).join('').toUpperCase();
    return { raw: s, hex: hex, rgb: r + ' ' + g + ' ' + b, alpha: a };
  }
  function pick(selector) {
    const el = document.querySelector(selector);
    if (!el) return { selector: selector, missing: true };
    const cs = getComputedStyle(el);
    return {
      selector: selector,
      tag: el.tagName.toLowerCase(),
      className: String(el.className || '').slice(0, 120),
      color: parseColor(cs.color),
      backgroundColor: parseColor(cs.backgroundColor),
      borderTopColor: parseColor(cs.borderTopColor),
      borderTopWidth: cs.borderTopWidth,
      borderRadius: cs.borderRadius,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      text: String(el.innerText || '').replace(/\\s+/g, ' ').slice(0, 60)
    };
  }
  const selectors = ${JSON.stringify(DEFAULT_SELECTORS)};
  const probe = {
    href: location.href,
    title: document.title,
    bodyClass: document.body.className,
    items: selectors.map(pick)
  };
  const el = document.createElement('pre');
  el.id = '${PROBE_ID}';
  el.setAttribute('data-theme-probe', '1');
  el.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(probe))));
  document.documentElement.appendChild(el);
})();
`.trim();

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return fallback;
  return process.argv[i + 1];
}

function decodeHtmlEntities(html) {
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractProbe(html) {
  const patterns = [
    new RegExp(`<pre[^>]*id="${PROBE_ID}"[^>]*>([\\s\\S]*?)</pre>`, 'i'),
    new RegExp(`<pre[^>]*data-theme-probe="1"[^>]*>([\\s\\S]*?)</pre>`, 'i'),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (!match) continue;
    const raw = decodeHtmlEntities(match[1]).replace(/\s+/g, '');
    try {
      return JSON.parse(decodeURIComponent(escape(Buffer.from(raw, 'base64').toString('binary'))));
    } catch {
      try {
        return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
      } catch {
        return JSON.parse(decodeHtmlEntities(match[1]));
      }
    }
  }
  return null;
}

async function main() {
  const url = arg('--url');
  const out = arg('--out');
  if (!url || !out) {
    console.error('Usage: probe-theme.mjs --url https://example.com/ --out raw/theme-computed.json');
    process.exit(2);
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    console.error('Need CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
    process.exit(2);
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/content?cacheTTL=0`;
  const body = {
    url,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    gotoOptions: { waitUntil: 'networkidle2', timeout: 45000 },
    waitForSelector: { selector: `#${PROBE_ID}`, timeout: 20000 },
    addScriptTag: [{ id: 'theme-probe', content: PROBE_SCRIPT }],
    rejectResourceTypes: ['media', 'websocket', 'manifest'],
    viewport: { width: 1440, height: 900 },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`CF /content returned non-JSON HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  if (!response.ok || payload.success === false) {
    const err = payload.errors?.[0]?.message || text.slice(0, 300);
    throw new Error(`CF /content HTTP ${response.status}: ${err}`);
  }

  const html = typeof payload.result === 'string' ? payload.result : payload.result?.content || '';
  const probe = extractProbe(html);
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    sourceUrl: url,
    httpStatus: response.status,
    meta: payload.meta || null,
    probeFound: Boolean(probe),
    probe,
    htmlBytes: Buffer.byteLength(html),
  };

  const dest = resolve(out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(snapshot, null, 2)}\n`);

  if (!probe) {
    console.error(`probe missing in HTML (${snapshot.htmlBytes} bytes) → ${dest}`);
    process.exit(1);
  }

  const present = probe.items.filter((item) => !item.missing).length;
  const missing = probe.items.filter((item) => item.missing).map((item) => item.selector);
  console.log(`ok    ${url} → ${dest}`);
  console.log(`      ${present}/${probe.items.length} selectors present`);
  if (missing.length) console.log(`      missing: ${missing.join(', ')}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
