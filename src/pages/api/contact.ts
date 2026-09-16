import type { APIRoute } from 'astro';
import { createContactSubmission, createAssetRecord } from '../../lib/db';
import { generateObjectKey, uploadToR2 } from '../../lib/r2';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime;
    const env = runtime?.env as Env | undefined;

    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const locale = String(formData.get('locale') || 'en');
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const projectType = String(formData.get('projectType') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const file = formData.get('file');

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let fileKey: string | undefined;
    let fileName: string | undefined;

    if (file instanceof File && file.size > 0 && env.R2) {
      const key = generateObjectKey(file.name, 'floor-plans');
      const buffer = await file.arrayBuffer();
      const upload = await uploadToR2(env.R2, key, buffer, file.type || 'application/octet-stream');

      await createAssetRecord(env.DB, {
        key: upload.key,
        contentType: upload.contentType,
        sizeBytes: upload.size,
        originalName: file.name,
        purpose: 'floor-plan',
      });

      fileKey = upload.key;
      fileName = file.name;
    }

    const id = await createContactSubmission(env.DB, {
      locale,
      name,
      email,
      projectType,
      message,
      fileKey,
      fileName,
    });

    return new Response(
      JSON.stringify({ success: true, id, fileKey }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact submission error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
