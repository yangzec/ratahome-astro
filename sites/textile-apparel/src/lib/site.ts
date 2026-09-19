import { siteConfig } from '@site/config';

/** Resolve site_id from Cloudflare env or fall back to site config. */
export function resolveSiteId(env?: { SITE_ID?: string }): string {
  return env?.SITE_ID ?? siteConfig.siteId;
}
