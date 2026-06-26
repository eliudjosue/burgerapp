import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { SupabaseClientService } from '../supabase.client';

const PUBLIC_URL =
  'https://project.supabase.co/storage/v1/object/public/product-images/products/uuid.jpg';

const SITE_URL =
  'https://project.supabase.co/storage/v1/object/public/site-assets/site/uuid.jpg';

function makeFile(type: string, sizeBytes?: number): File {
  const file = new File(['x'], 'test', { type });
  if (sizeBytes !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true });
  }
  return file;
}

class SupabaseClientServiceStub {
  readonly storageChain = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'products/uuid.jpg' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: PUBLIC_URL } }),
  };
  client = {
    storage: { from: vi.fn().mockReturnValue(this.storageChain) },
  };
}

describe('StorageService', () => {
  let stub: SupabaseClientServiceStub;

  beforeEach(() => {
    stub = new SupabaseClientServiceStub();
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseClientService, useValue: stub }],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(StorageService)).toBeTruthy();
  });

  // ── Validation ───────────────────────────────────────────────────────────

  it('should throw for a non-image MIME type', async () => {
    const service = TestBed.inject(StorageService);
    await expect(
      service.uploadProductImage(makeFile('application/pdf')),
    ).rejects.toThrow(/permitido/);
  });

  it('should throw for a file exceeding 2 MB', async () => {
    const service = TestBed.inject(StorageService);
    const tooBig = makeFile('image/jpeg', 2 * 1024 * 1024 + 1);
    await expect(service.uploadProductImage(tooBig)).rejects.toThrow(/2 MB/);
  });

  it('should not throw for a file exactly at the 2 MB limit', async () => {
    const service = TestBed.inject(StorageService);
    const atLimit = makeFile('image/jpeg', 2 * 1024 * 1024);
    await expect(service.uploadProductImage(atLimit)).resolves.toBeTruthy();
  });

  // ── uploadProductImage — bucket and path ─────────────────────────────────

  it('should call storage.from("product-images")', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadProductImage(makeFile('image/jpeg'));
    expect(stub.client.storage.from).toHaveBeenCalledWith('product-images');
  });

  it('should store files under the products/ prefix', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadProductImage(makeFile('image/jpeg'));
    const uploadedPath = stub.storageChain.upload.mock.calls[0][0] as string;
    expect(uploadedPath).toMatch(/^products\//);
  });

  it('should derive .jpg extension from image/jpeg', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadProductImage(makeFile('image/jpeg'));
    const uploadedPath = stub.storageChain.upload.mock.calls[0][0] as string;
    expect(uploadedPath).toMatch(/\.jpg$/);
  });

  it('should derive .png extension from image/png', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadProductImage(makeFile('image/png'));
    const uploadedPath = stub.storageChain.upload.mock.calls[0][0] as string;
    expect(uploadedPath).toMatch(/\.png$/);
  });

  it('should derive .webp extension from image/webp', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadProductImage(makeFile('image/webp'));
    const uploadedPath = stub.storageChain.upload.mock.calls[0][0] as string;
    expect(uploadedPath).toMatch(/\.webp$/);
  });

  it('should upload with upsert: false', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadProductImage(makeFile('image/jpeg'));
    const options = stub.storageChain.upload.mock.calls[0][2] as Record<string, unknown>;
    expect(options).toMatchObject({ upsert: false });
  });

  it('should return the public URL on success', async () => {
    const service = TestBed.inject(StorageService);
    const url = await service.uploadProductImage(makeFile('image/jpeg'));
    expect(url).toBe(PUBLIC_URL);
  });

  it('should throw when Supabase upload returns an error', async () => {
    stub.storageChain.upload = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'Unauthorized' } });
    const service = TestBed.inject(StorageService);
    await expect(service.uploadProductImage(makeFile('image/jpeg'))).rejects.toThrow();
  });

  // ── uploadSiteAsset ──────────────────────────────────────────────────────

  it('uploadSiteAsset should call storage.from("site-assets")', async () => {
    stub.storageChain.getPublicUrl.mockReturnValue({ data: { publicUrl: SITE_URL } });
    const service = TestBed.inject(StorageService);
    await service.uploadSiteAsset(makeFile('image/jpeg'));
    expect(stub.client.storage.from).toHaveBeenCalledWith('site-assets');
  });

  it('uploadSiteAsset should store files under the site/ prefix', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadSiteAsset(makeFile('image/jpeg'));
    const uploadedPath = stub.storageChain.upload.mock.calls[0][0] as string;
    expect(uploadedPath).toMatch(/^site\//);
  });

  it('uploadSiteAsset should throw for invalid MIME type', async () => {
    const service = TestBed.inject(StorageService);
    await expect(
      service.uploadSiteAsset(makeFile('image/gif')),
    ).rejects.toThrow(/permitido/);
  });

  it('uploadSiteAsset should throw for oversized file', async () => {
    const service = TestBed.inject(StorageService);
    const tooBig = makeFile('image/png', 2 * 1024 * 1024 + 1);
    await expect(service.uploadSiteAsset(tooBig)).rejects.toThrow(/2 MB/);
  });

  // ── uploadImage generic ──────────────────────────────────────────────────

  it('uploadImage should use the provided bucket name', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadImage('custom-bucket', 'folder', makeFile('image/jpeg'));
    expect(stub.client.storage.from).toHaveBeenCalledWith('custom-bucket');
  });

  it('uploadImage should use the provided folder prefix', async () => {
    const service = TestBed.inject(StorageService);
    await service.uploadImage('custom-bucket', 'myfolder', makeFile('image/jpeg'));
    const uploadedPath = stub.storageChain.upload.mock.calls[0][0] as string;
    expect(uploadedPath).toMatch(/^myfolder\//);
  });
});
