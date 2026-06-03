/**
 * Vercel Blob upload wrapper.
 *
 * Thin facade over `@vercel/blob` that:
 *   1. Validates the runtime environment (BLOB_READ_WRITE_TOKEN must be set).
 *   2. Validates the input file (mime type and size) before calling the
 *      SDK. This avoids paying for an upload round-trip when we already
 *      know it's going to be rejected.
 *   3. Names files deterministically (folder/UUID-sanitized-original)
 *      so we never collide on identical uploads and so deletion by
 *      URL is unambiguous.
 *
 * Throws `UploadNotConfiguredError` if the env var is missing.
 * Throws `ImageValidationError` for invalid mime or oversized files.
 *
 * The `del` operation is best-effort: a missing token logs a warning
 * and returns without throwing. We don't want a stale delete to fail
 * an otherwise-successful form submit.
 */

import { put, del } from '@vercel/blob';
import { UploadNotConfiguredError, ImageValidationError } from '@/domain/errors/AdminErrors';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export type BlobFolder = 'products' | 'brands' | 'categories';

export interface UploadImageInput {
  file: Blob | File;
  filename: string;
  folder: BlobFolder;
}

export interface DeleteImageInput {
  url: string;
}

/**
 * Build a safe blob pathname from a user-supplied filename.
 *  - Preserves the file extension when we can identify it
 *  - Replaces every other unsafe character with `-`
 *  - Prepends a UUID so two uploads of the same name never collide
 */
const buildSafePathname = (folder: BlobFolder, filename: string): string => {
  const safe = filename.replace(/[^a-z0-9.-]/gi, '-');
  return `${folder}/${crypto.randomUUID()}-${safe}`;
};

/**
 * Upload an image to Vercel Blob and return the public URL.
 *
 * Validation order:
 *   1. Env var (UploadNotConfiguredError) — fail fast at boot
 *   2. Mime type (ImageValidationError) — cheap to check
 *   3. File size (ImageValidationError) — cheap to check
 *   4. Network upload (raises whatever @vercel/blob raises; we don't
 *      try to wrap it — call sites handle their own try/catch)
 */
export const uploadImage = async (input: UploadImageInput): Promise<string> => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new UploadNotConfiguredError();
  }

  if (!ALLOWED_MIME_TYPES.has(input.file.type)) {
    throw new ImageValidationError(`unsupported mime type: ${input.file.type}`);
  }

  if (input.file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageValidationError(
      `file too large: ${input.file.size} bytes (max ${MAX_FILE_SIZE_BYTES})`,
    );
  }

  const pathname = buildSafePathname(input.folder, input.filename);

  const result = await put(pathname, input.file, {
    access: 'public',
    token,
  });

  return result.url;
};

/**
 * Best-effort delete of a previously-uploaded blob. If the token is
 * missing we log a warning and return without throwing — the caller
 * (typically a form submit) should not fail because the environment
 * is misconfigured for cleanup.
 */
export const deleteImage = async (input: DeleteImageInput): Promise<void> => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    // eslint-disable-next-line no-console
    console.warn(`[blob] deleteImage skipped: BLOB_READ_WRITE_TOKEN is not set (url=${input.url})`);
    return;
  }

  try {
    await del(input.url, { token });
  } catch (err) {
    // Best-effort: log and swallow so a stale blob URL doesn't break
    // an otherwise-successful form submit.
    // eslint-disable-next-line no-console
    console.warn(`[blob] deleteImage failed for url=${input.url}:`, err);
  }
};
