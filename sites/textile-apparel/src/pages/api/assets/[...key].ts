import type { APIRoute } from 'astro';
import { getFromR2 } from '@trade/core/r2';
import { resolveSiteId } from '../../../lib/site';
import { getRuntimeEnv } from '../../../lib/runtime';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const env = getRuntimeEnv();

  if (!env?.R2) {
    return new Response('Storage not configured', { status: 503 });
  }

  const key = params.key;
  if (!key) {
    return new Response('Missing key', { status: 400 });
  }

  const siteId = resolveSiteId(env);
  if (!key.startsWith(`${siteId}/`)) {
    return new Response('Not found', { status: 404 });
  }

  const object = await getFromR2(env.R2, key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  if (object.httpMetadata?.contentType) {
    headers.set('Content-Type', object.httpMetadata.contentType);
  }
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};
