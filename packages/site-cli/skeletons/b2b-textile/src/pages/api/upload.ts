import type { APIRoute } from 'astro';
import { createAssetRecord } from '@trade/core/db';
import { generateObjectKey, uploadToR2, getPublicUrl } from '@trade/core/r2';
import { resolveSiteId } from '../../lib/site';
import { getRuntimeEnv } from '../../lib/runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = getRuntimeEnv();

    if (!env?.R2 || !env?.DB) {
      return new Response(JSON.stringify({ error: 'Storage not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteId = resolveSiteId(env);
    const formData = await request.formData();
    const file = formData.get('file');
    const purpose = String(formData.get('purpose') || 'upload');

    if (!(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large (max 20MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const key = generateObjectKey(siteId, file.name, purpose);
    const buffer = await file.arrayBuffer();
    const upload = await uploadToR2(env.R2, key, buffer, file.type || 'application/octet-stream');

    await createAssetRecord(env.DB, {
      siteId,
      key: upload.key,
      contentType: upload.contentType,
      sizeBytes: upload.size,
      originalName: file.name,
      purpose,
    });

    const url = getPublicUrl(upload.key, env.R2_PUBLIC_URL);

    return new Response(
      JSON.stringify({ success: true, key: upload.key, url, size: upload.size }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
