'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Button } from '@/presentation/components/ui/button';
import { cn } from '@/presentation/lib/utils';

/**
 * Mirror of `BlobFolder` in `@/infrastructure/uploads/blob`. Inlined
 * here so the client component does not need to pull types from a
 * server-only module. Keep these two in sync if the upload folder
 * taxonomy ever changes.
 */
export type ImageFolder = 'products' | 'brands' | 'categories';

export interface ImageUploadInputProps {
  /**
   * Form field name. The submitted value is the URL string (whether
   * pasted or produced by an upload), so a hidden input named `name`
   * carries the canonical value to the server action.
   */
  name: string;
  defaultValue?: string;
  folder: ImageFolder;
  /**
   * Optional id used for the visible URL input's label `htmlFor` and
   * for aria-describedby on the hidden + file inputs. Defaults to `name`.
   */
  id?: string;
  label?: string;
  /** Optional helper text rendered under the inputs. */
  hint?: string;
  /**
   * Optional onChange fired whenever the canonical URL value changes
   * (pasted, uploaded, or cleared). Useful for keeping an outer form
   * in sync — the form's submit handler reads from this state.
   */
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Image input with two paths:
 *
 *  1. URL paste — always visible, always works. The form submits the
 *     URL string via the hidden `<input name={name} />`.
 *  2. File upload — POSTs the picked file to `/api/admin/upload`.
 *     On success, the returned URL is written to the hidden input
 *     (and shown in the URL field). On 404 (route not yet built by
 *     gamma) we fall back silently to the URL-paste path.
 *
 * Why both: gamma's `/api/admin/upload` route is part of phase 5
 * gamma. Beta is shipping first, so we keep the URL paste as the
 * always-available fallback. Once gamma lands, the file path lights
 * up automatically with no form changes.
 */
export function ImageUploadInput({
  name,
  defaultValue = '',
  folder,
  id,
  label,
  hint,
  onChange,
  className,
}: ImageUploadInputProps) {
  const inputId = id ?? name;
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string>(defaultValue);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (res.status === 404) {
        // gamma hasn't built the route yet — keep the file input
        // hidden but tell the user to paste the URL for now.
        toast.info('Subida no disponible. Pegá la URL de la imagen.');
        if (fileRef.current) fileRef.current.value = '';
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        throw new Error('Upload response missing url');
      }
      setUrl(data.url);
      onChange?.(data.url);
      toast.success('Imagen subida');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo subir la imagen';
      toast.error(message);
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be re-selected later.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClear = () => {
    setUrl('');
    onChange?.('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}

      {/* Preview */}
      {url ? (
        <div className="border-border/60 relative h-32 w-32 overflow-hidden rounded-md border bg-muted">
          {/* Using a plain <img> on purpose: the URL may come from
              any host and we don't want to configure remotePatterns
              for an admin-only flow. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Vista previa"
            className="h-full w-full object-cover"
            onError={(e) => {
              // If the URL is broken, hide the broken image icon.
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            aria-label="Quitar imagen"
            className="absolute right-1 top-1 rounded-md border border-zinc-800 bg-zinc-950/80 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="border-border/60 bg-muted/30 flex h-32 w-32 items-center justify-center rounded-md border border-dashed text-muted-foreground"
        >
          <ImageIcon className="h-6 w-6" />
        </div>
      )}

      {/* Hidden input — the canonical value submitted with the form. */}
      <input type="hidden" name={name} value={url} />

      {/* URL paste (always available) */}
      <div className="space-y-1.5">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground">
          URL de la imagen
        </Label>
        <Input
          id={inputId}
          type="url"
          inputMode="url"
          placeholder="https://cdn.example.com/imagen.png"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            onChange?.(e.target.value);
          }}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
        />
      </div>

      {/* File upload (fallback to URL paste if /api/admin/upload is missing) */}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          aria-label="Subir archivo de imagen"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="gap-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-3 w-3" aria-hidden="true" />
              Subir archivo
            </>
          )}
        </Button>
        <span className="text-[10px] text-muted-foreground">JPEG, PNG o WebP. Máx 4 MB.</span>
      </div>

      {hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
