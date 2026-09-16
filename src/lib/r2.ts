import type { R2Bucket } from '@cloudflare/workers-types';

export interface UploadResult {
  key: string;
  size: number;
  contentType: string;
}

/** Generate a unique R2 object key for uploads. */
export function generateObjectKey(originalName: string, purpose = 'floor-plans'): string {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  return `${purpose}/${timestamp}-${random}-${safeName || `file.${ext}`}`;
}

/** Upload a file buffer to R2. */
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

/** Build public URL for an R2 object (requires custom domain or public bucket). */
export function getPublicUrl(key: string, publicBaseUrl?: string): string {
  const base = publicBaseUrl ?? '/api/assets';
  return `${base}/${encodeURIComponent(key)}`;
}

/** Fetch object from R2 for proxy serving. */
export async function getFromR2(bucket: R2Bucket, key: string) {
  return bucket.get(key);
}
