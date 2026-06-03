import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { uploadImage, deleteImage } from '../blob';
import { UploadNotConfiguredError, ImageValidationError } from '@/domain/errors/AdminErrors';

const makeFile = (type: string, size: number): File => {
  // Construct a File with explicit size in the test environment.
  // We use Blob for the body and a thin File-like wrapper for the
  // mime-type property tests care about.
  const body = new Blob([new Uint8Array(size)], { type });
  return new File([body], 'sample.bin', { type });
};

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('uploadImage', () => {
  it('throws UploadNotConfiguredError when BLOB_READ_WRITE_TOKEN is missing', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const file = makeFile('image/png', 1024);

    await expect(
      uploadImage({ file, filename: 'x.png', folder: 'products' }),
    ).rejects.toBeInstanceOf(UploadNotConfiguredError);
  });

  it('throws ImageValidationError for unsupported mime types', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_test_token';

    const file = makeFile('image/gif', 1024);

    await expect(
      uploadImage({ file, filename: 'anim.gif', folder: 'products' }),
    ).rejects.toBeInstanceOf(ImageValidationError);
  });

  it('throws ImageValidationError for files larger than 4 MB', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_test_token';

    const file = makeFile('image/png', 4 * 1024 * 1024 + 1);

    await expect(
      uploadImage({ file, filename: 'big.png', folder: 'products' }),
    ).rejects.toBeInstanceOf(ImageValidationError);
  });
});

describe('deleteImage', () => {
  it('logs a warning and does not throw when BLOB_READ_WRITE_TOKEN is missing', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(deleteImage({ url: 'https://example.com/blob/x' })).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});
