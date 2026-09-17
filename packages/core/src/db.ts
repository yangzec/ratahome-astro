import type { D1Database } from '@cloudflare/workers-types';

export interface ContactSubmission {
  siteId: string;
  locale: string;
  name: string;
  email: string;
  projectType?: string;
  message?: string;
  fileKey?: string;
  fileName?: string;
}

export async function createContactSubmission(db: D1Database, data: ContactSubmission) {
  const result = await db
    .prepare(
      `INSERT INTO contact_submissions (site_id, locale, name, email, project_type, message, file_key, file_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
    .bind(
      data.siteId,
      data.locale,
      data.name,
      data.email,
      data.projectType ?? null,
      data.message ?? null,
      data.fileKey ?? null,
      data.fileName ?? null
    )
    .first<{ id: number }>();

  return result?.id;
}

export async function createAssetRecord(
  db: D1Database,
  data: {
    siteId: string;
    key: string;
    contentType?: string;
    sizeBytes?: number;
    originalName?: string;
    purpose?: string;
  }
) {
  await db
    .prepare(
      `INSERT INTO assets (site_id, key, content_type, size_bytes, original_name, purpose)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      data.siteId,
      data.key,
      data.contentType ?? null,
      data.sizeBytes ?? null,
      data.originalName ?? null,
      data.purpose ?? 'upload'
    )
    .run();
}

export async function getPageOverride(
  db: D1Database,
  siteId: string,
  locale: string,
  slug: string
) {
  return db
    .prepare(
      `SELECT title, description, body FROM page_content WHERE site_id = ? AND locale = ? AND slug = ?`
    )
    .bind(siteId, locale, slug)
    .first<{ title: string; description: string; body: string }>();
}
