import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase.client';

const ALLOWED_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const EXT_FROM_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly supabase = inject(SupabaseClientService);

  readonly maxSizeBytes = MAX_SIZE_BYTES;
  readonly allowedTypes = ALLOWED_TYPES;

  async uploadProductImage(file: File): Promise<string> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG y WebP.');
    }
    if (file.size > MAX_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`La imagen no puede superar 2 MB (tamaño actual: ${mb} MB).`);
    }

    const ext = EXT_FROM_MIME[file.type] ?? 'jpg';
    const path = `products/${crypto.randomUUID()}.${ext}`;

    const { error } = await this.supabase.client.storage
      .from('product-images')
      .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = this.supabase.client.storage
      .from('product-images')
      .getPublicUrl(path);

    return data.publicUrl;
  }
}
