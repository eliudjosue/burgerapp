import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminSiteSettingsComponent } from './admin-site-settings.component';
import { AuthService } from '../../../../core/services/auth.service';
import { SiteSettingsService } from '../../../../core/services/site-settings.service';
import { StorageService } from '../../../../core/services/storage.service';
import type { SiteSettingsData } from '../../../../core/services/site-settings.service';
import type { StaffProfile } from '../../../../core/services/auth.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_SETTINGS: SiteSettingsData = {
  businessHours: 'Lunes a Domingo 11:00 - 22:00',
  whatsappNumber: '5491123456789',
  logoUrl: null,
  bannerImageUrl: null,
  bannerTitle: '¡Hamburguesas!',
  bannerSubtitle: 'Las mejores de la zona',
  bannerButtonText: 'Ver Catálogo',
  bannerButtonLink: '/catalog',
  bankTransferAlias: 'ALIAS.PENDIENTE',
  bankTransferCbu: '0000000000000000000000',
};

const UPLOAD_URL = 'https://example.supabase.co/storage/v1/object/public/site-assets/site/uuid.jpg';

function makeFile(type = 'image/jpeg', sizeBytes = 1024): File {
  const f = new File(['x'], 'test.jpg', { type });
  Object.defineProperty(f, 'size', { value: sizeBytes, configurable: true });
  return f;
}

// ── Stubs ─────────────────────────────────────────────────────────────────────

class SiteSettingsServiceStub {
  getSettings = vi.fn().mockResolvedValue(MOCK_SETTINGS);
  updateSettings = vi.fn().mockResolvedValue(undefined);
}

class StorageServiceStub {
  uploadSiteAsset = vi.fn().mockResolvedValue(UPLOAD_URL);
  readonly maxSizeBytes = 2 * 1024 * 1024;
  readonly allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Admin Test', role: 'admin' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminSiteSettingsComponent', () => {
  let settingsStub: SiteSettingsServiceStub;
  let storageStub: StorageServiceStub;

  beforeEach(async () => {
    settingsStub = new SiteSettingsServiceStub();
    storageStub = new StorageServiceStub();
    await TestBed.configureTestingModule({
      imports: [AdminSiteSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: SiteSettingsService, useValue: settingsStub },
        { provide: StorageService, useValue: storageStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminSiteSettingsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', () => {
    const fixture = TestBed.createComponent(AdminSiteSettingsComponent);
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  it('should populate form fields from settings after init', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    expect(c.fBusinessHours()).toBe('Lunes a Domingo 11:00 - 22:00');
    expect(c.fWhatsappNumber()).toBe('5491123456789');
    expect(c.fBannerTitle()).toBe('¡Hamburguesas!');
    expect(c.fBannerSubtitle()).toBe('Las mejores de la zona');
    expect(c.fBannerButtonText()).toBe('Ver Catálogo');
    expect(c.fBannerButtonLink()).toBe('/catalog');
    expect(c.fBankTransferAlias()).toBe('ALIAS.PENDIENTE');
    expect(c.fBankTransferCbu()).toBe('0000000000000000000000');
  });

  it('should set isLoading to false after successful init', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    expect(c.isLoading()).toBe(false);
  });

  it('should set hasError to true when getSettings fails', async () => {
    settingsStub.getSettings.mockRejectedValue(new Error('DB error'));
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    expect(c.hasError()).toBe(true);
    expect(c.isLoading()).toBe(false);
  });

  it('should set null URLs as null signals', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    expect(c.fLogoUrl()).toBeNull();
    expect(c.fBannerImageUrl()).toBeNull();
  });

  // ── isPending ──────────────────────────────────────────────────────────────

  it('isPending returns true for ALIAS.PENDIENTE', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    expect(c.isPending('ALIAS.PENDIENTE')).toBe(true);
  });

  it('isPending returns true for the all-zeros CBU placeholder', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    expect(c.isPending('0000000000000000000000')).toBe(true);
  });

  it('isPending returns true for the fake WhatsApp placeholder', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    expect(c.isPending('5400000000000')).toBe(true);
  });

  it('isPending returns false for a real alias', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    expect(c.isPending('burger.house.mp')).toBe(false);
  });

  it('isPending returns false for null', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    expect(c.isPending(null)).toBe(false);
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('formErrors is empty when whatsapp number is empty (field is optional)', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    c.fWhatsappNumber.set('');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('formErrors is empty for a valid 13-digit whatsapp number', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    c.fWhatsappNumber.set('5491123456789');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('formErrors reports error for whatsapp with letters', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    c.fWhatsappNumber.set('+549 11 2345-6789');
    expect(c.formErrors().some(e => e.includes('WhatsApp'))).toBe(true);
  });

  it('formErrors reports error for whatsapp with fewer than 10 digits', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    c.fWhatsappNumber.set('123456789');
    expect(c.formErrors().some(e => e.includes('WhatsApp'))).toBe(true);
  });

  it('visibleErrors is empty before first save attempt', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    c.fWhatsappNumber.set('+invalid');
    expect(c.visibleErrors()).toHaveLength(0);
  });

  it('visibleErrors shows errors after save attempt with invalid whatsapp', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.fWhatsappNumber.set('bad');
    await c.save();
    expect(c.visibleErrors().length).toBeGreaterThan(0);
  });

  // ── save ───────────────────────────────────────────────────────────────────

  it('save() calls updateSettings with all form field values', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.fBusinessHours.set('Lun a Vie 12:00-22:00');
    c.fWhatsappNumber.set('5491198765432');

    await c.save();

    expect(settingsStub.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        businessHours: 'Lun a Vie 12:00-22:00',
        whatsappNumber: '5491198765432',
      }),
    );
  });

  it('save() sets saveSuccess to true on success', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    await c.save();
    expect(c.saveSuccess()).toBe(true);
  });

  it('save() sets saveError and does not set saveSuccess when updateSettings throws', async () => {
    settingsStub.updateSettings.mockRejectedValue(new Error('Supabase error'));
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    await c.save();
    expect(c.saveError()).toBeTruthy();
    expect(c.saveSuccess()).toBe(false);
  });

  it('save() does not call updateSettings if whatsapp validation fails', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.fWhatsappNumber.set('not-valid');
    await c.save();
    expect(settingsStub.updateSettings).not.toHaveBeenCalled();
  });

  it('save() clears saving flag after completion', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    await c.save();
    expect(c.saving()).toBe(false);
  });

  it('save() converts empty trimmed text fields to null', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.fBannerTitle.set('   ');
    c.fBannerSubtitle.set('');
    await c.save();
    expect(settingsStub.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        bannerTitle: null,
        bannerSubtitle: null,
      }),
    );
  });

  // ── save with file upload ──────────────────────────────────────────────────

  it('save() uploads staged logo file and includes returned URL', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.logoFile.set(makeFile());

    await c.save();

    expect(storageStub.uploadSiteAsset).toHaveBeenCalled();
    expect(settingsStub.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ logoUrl: UPLOAD_URL }),
    );
  });

  it('save() clears logoFile after upload', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.logoFile.set(makeFile());

    await c.save();

    expect(c.logoFile()).toBeNull();
  });

  it('save() uploads staged banner file and includes returned URL', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.bannerFile.set(makeFile());

    await c.save();

    expect(storageStub.uploadSiteAsset).toHaveBeenCalled();
    expect(settingsStub.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ bannerImageUrl: UPLOAD_URL }),
    );
  });

  it('save() sets saveError when upload throws', async () => {
    storageStub.uploadSiteAsset.mockRejectedValue(new Error('Upload failed'));
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();
    c.logoFile.set(makeFile());

    await c.save();

    expect(c.saveError()).toMatch(/Upload failed/);
    expect(c.saving()).toBe(false);
  });

  it('save() does not call uploadSiteAsset when no files are staged', async () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    await c.ngOnInit();

    await c.save();

    expect(storageStub.uploadSiteAsset).not.toHaveBeenCalled();
  });

  // ── File change handlers ───────────────────────────────────────────────────

  it('onLogoFileChange sets logoFile for a valid image', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    const file = makeFile('image/png');
    const event = { target: { files: [file] } } as unknown as Event;
    c.onLogoFileChange(event);
    expect(c.logoFile()).toBe(file);
  });

  it('onLogoFileChange sets saveError for invalid MIME type', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    const event = {
      target: { files: [makeFile('image/gif')] },
    } as unknown as Event;
    c.onLogoFileChange(event);
    expect(c.saveError()).toMatch(/no permitido/);
    expect(c.logoFile()).toBeNull();
  });

  it('onLogoFileChange sets saveError for oversized file', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    const bigFile = makeFile('image/jpeg', 2 * 1024 * 1024 + 1);
    const event = { target: { files: [bigFile] } } as unknown as Event;
    c.onLogoFileChange(event);
    expect(c.saveError()).toMatch(/2 MB/);
    expect(c.logoFile()).toBeNull();
  });

  it('onLogoFileChange clears saveError on valid file', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    c.saveError.set('previous error');
    const event = { target: { files: [makeFile()] } } as unknown as Event;
    c.onLogoFileChange(event);
    expect(c.saveError()).toBeNull();
  });

  it('onBannerFileChange sets bannerFile for a valid image', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    const file = makeFile('image/webp');
    const event = { target: { files: [file] } } as unknown as Event;
    c.onBannerFileChange(event);
    expect(c.bannerFile()).toBe(file);
  });

  it('onBannerFileChange sets saveError for invalid MIME type', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    const event = {
      target: { files: [makeFile('application/pdf')] },
    } as unknown as Event;
    c.onBannerFileChange(event);
    expect(c.saveError()).toMatch(/no permitido/);
    expect(c.bannerFile()).toBeNull();
  });

  it('onBannerFileChange does nothing when no file is selected', () => {
    const c = TestBed.createComponent(AdminSiteSettingsComponent).componentInstance;
    const event = { target: { files: [] } } as unknown as Event;
    c.onBannerFileChange(event);
    expect(c.bannerFile()).toBeNull();
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('goBack() navigates to /staff/admin', () => {
    const fixture = TestBed.createComponent(AdminSiteSettingsComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/admin']);
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(AdminSiteSettingsComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });
});
