/**
 * Admin image upload endpoint.
 *
 * POST /api/admin/upload
 *   - multipart/form-data with:
 *       file:   Blob | File (image/jpeg | image/png | image/webp, max 4 MB)
 *       folder: 'products' | 'brands' | 'categories'
 *   - Returns: { url: string } on success.
 *
 * Errors:
 *   401  Not authenticated or not an ADMIN.
 *   400  Missing/invalid field, validation error.
 *   503  BLOB_READ_WRITE_TOKEN is not configured in the environment.
 *   500  Anything else (network, unexpected).
 *
 * The `runtime = 'nodejs'` declaration is required: `@vercel/blob`
 * uses `crypto.createHash` and other Node-only APIs that are not
 * available in the Edge runtime.
 *
 * Why a server route (not a server action):
 *   - The upload payload is binary; multipart/form-data round-trips
 *     cleaner through a real HTTP handler than a server action.
 *   - The result is consumed by client-side fetch() from the admin
 *     forms (beta's product/brand/category forms), so an HTTP
 *     endpoint is the most natural API.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { uploadImage, type BlobFolder } from '@/infrastructure/uploads/blob';
import { ImageValidationError, UploadNotConfiguredError } from '@/domain/errors/AdminErrors';

export const runtime = 'nodejs';
// We never want this to be statically optimized; it depends on the
// request body, the session, and the env.
export const dynamic = 'force-dynamic';

const ALLOWED_FOLDERS: ReadonlySet<BlobFolder> = new Set<BlobFolder>([
  'products',
  'brands',
  'categories',
]);

const isBlobFolder = (value: string): value is BlobFolder =>
  ALLOWED_FOLDERS.has(value as BlobFolder);

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Auth gate. Even though `/admin/*` is protected by middleware,
  //    we re-check the role here so a future refactor that exposes
  //    this route outside the middleware matcher doesn't accidentally
  //    open it to non-admins. Defense in depth.
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse multipart. `request.formData()` works in the App Router
  //    and returns a FormData object whose `get()` yields File/Blob
  //    values. Note: Next.js bundles the body parser for App Router
  //    route handlers — no extra config needed.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invalid form data. Expected multipart/form-data.' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  const folder = formData.get('folder');

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing "file" field.' }, { status: 400 });
  }
  if (typeof folder !== 'string' || !isBlobFolder(folder)) {
    return NextResponse.json(
      {
        error: `Invalid "folder" field. Expected one of: ${Array.from(ALLOWED_FOLDERS).join(', ')}.`,
      },
      { status: 400 },
    );
  }

  // The Blob `name` property is set on File objects but may be empty
  // for raw Blobs. Fall back to a sensible default so the Vercel Blob
  // pathname is never empty.
  const filename =
    file instanceof File && file.name && file.name.length > 0
      ? file.name
      : `upload.${guessExt(file.type) || 'bin'}`;

  // 3. Delegate to the shared helper. This keeps mime/size/env
  //    validation in one place (also used by future server actions
  //    that may upload directly).
  try {
    const url = await uploadImage({ file, filename, folder });
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    if (err instanceof UploadNotConfiguredError) {
      return NextResponse.json(
        { error: 'Image upload is not configured on this server.' },
        { status: 503 },
      );
    }
    if (err instanceof ImageValidationError) {
      return NextResponse.json({ error: err.reason }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[admin/upload] unexpected error:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

/**
 * Best-effort extension guess from a mime type. Used to keep
 * uploaded files in a sane shape when the browser doesn't send a
 * filename (rare, but it happens with some mobile UIs).
 */
function guessExt(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return '';
  }
}
