import type { D1Database } from '@cloudflare/workers-types';

export interface ContactSubmission {
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
      `INSERT INTO contact_submissions (locale, name, email, project_type, message, file_key, file_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
    .bind(
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
    key: string;
    contentType?: string;
    sizeBytes?: number;
    originalName?: string;
    purpose?: string;
  }
) {
  await db
    .prepare(
      `INSERT INTO assets (key, content_type, size_bytes, original_name, purpose)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
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
  locale: string,
  slug: string
) {
  return db
    .prepare(
      `SELECT title, description, body FROM page_content WHERE locale = ? AND slug = ?`
    )
    .bind(locale, slug)
    .first<{ title: string; description: string; body: string }>();
}
