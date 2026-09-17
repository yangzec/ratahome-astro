import type { R2Bucket } from '@cloudflare/workers-types';

export interface UploadResult {
  key: string;
  size: number;
  contentType: string;
}

/** Generate a unique R2 object key scoped by site_id. */
export function generateObjectKey(
  siteId: string,
  originalName: string,
  purpose = 'floor-plans'
): string {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  return `${siteId}/${purpose}/${timestamp}-${random}-${safeName || `file.${ext}`}`;
}

export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType: string
): Promise<UploadResult> {
  await bucket.put(key, data, {
    httpMetadata: { contentType },
  });

  return { key, size: data.byteLength, contentType };
}

export function getPublicUrl(key: string, publicBaseUrl?: string): string {
  const base = publicBaseUrl ?? '/api/assets';
  return `${base}/${encodeURIComponent(key)}`;
}

export async function getFromR2(bucket: R2Bucket, key: string) {
  return bucket.get(key);
}
