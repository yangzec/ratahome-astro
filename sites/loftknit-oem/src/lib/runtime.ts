import { env } from 'cloudflare:workers';

/** Cloudflare bindings (D1, R2, vars) — Astro v7+ via cloudflare:workers. */
export function getRuntimeEnv(): Env {
  return env as Env;
}
