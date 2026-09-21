import type { APIRoute } from 'astro';
import { createContactSubmission, createAssetRecord } from '@trade/core/db';
import { generateObjectKey, uploadToR2 } from '@trade/core/r2';
import { resolveSiteId } from '../../lib/site';
import { getRuntimeEnv } from '../../lib/runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const env = getRuntimeEnv();

    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteId = resolveSiteId(env);
    const formData = await request.formData();
    const locale = String(formData.get('locale') || 'en');
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const projectType = String(formData.get('projectType') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const company = String(formData.get('company') || '').trim();
    const whatsapp = String(formData.get('whatsapp') || '').trim();
    const rawMessage = String(formData.get('message') || '').trim();
    const file = formData.get('file');

    if (!name || !email || !rawMessage) {
      return new Response(JSON.stringify({ error: 'Name, email, and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const extras = [
      phone ? `Phone: ${phone}` : '',
      company ? `Company: ${company}` : '',
      whatsapp ? `WhatsApp: ${whatsapp}` : '',
    ].filter(Boolean);
    const message = extras.length ? `${extras.join('\n')}\n\n${rawMessage}` : rawMessage;

    let fileKey: string | undefined;
    let fileName: string | undefined;

    if (file instanceof File && file.size > 0 && env.R2) {
      const key = generateObjectKey(siteId, file.name, 'floor-plans');
      const buffer = await file.arrayBuffer();
      const upload = await uploadToR2(env.R2, key, buffer, file.type || 'application/octet-stream');

      await createAssetRecord(env.DB, {
        siteId,
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
      siteId,
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
