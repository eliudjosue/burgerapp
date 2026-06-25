import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminDashboardComponent } from './admin-dashboard.component';
import type { DashboardMetrics } from './admin-dashboard.component';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import type { StaffProfile } from '../../../../core/services/auth.service';
import { StorageService } from '../../../../core/services/storage.service';

const MOCK_METRICS: DashboardMetrics = {
  today_sales: 15000,
  week_sales: 87500,
  month_sales: 312000,
  pending_count: 3,
  top_products: [
    { name: 'Hamburguesa Clásica', quantity: 42 },
    { name: 'Combo Doble', quantity: 31 },
    { name: 'Papas Fritas', quantity: 28 },
  ],
};

class SupabaseClientServiceStub {
  client = {
    rpc: vi.fn().mockResolvedValue({ data: MOCK_METRICS, error: null }),
  };
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Admin Test', role: 'admin' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

const UPLOAD_URL = 'https://project.supabase.co/storage/v1/object/public/product-images/products/uuid.jpg';

class StorageServiceStub {
  uploadProductImage = vi.fn().mockResolvedValue(UPLOAD_URL);
}

describe('AdminDashboardComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: StorageService, useClass: StorageServiceStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call get_dashboard_metrics RPC on init', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('get_dashboard_metrics');
  });

  it('should populate metrics signal after successful load', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.metrics()).toEqual(MOCK_METRICS);
  });

  it('should set isLoading to false after successful init', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should set hasError to false on success', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.hasError()).toBe(false);
  });

  it('should set hasError to true when RPC returns an error', async () => {
    supabaseStub.client.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.hasError()).toBe(true);
  });

  it('should leave metrics null when RPC returns an error', async () => {
    supabaseStub.client.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.metrics()).toBeNull();
  });

  it('should set isLoading to false even when RPC returns an error', async () => {
    supabaseStub.client.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should reset hasError and reload on retry (ngOnInit called again)', async () => {
    supabaseStub.client.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'network error' },
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.hasError()).toBe(true);

    supabaseStub.client.rpc = vi.fn().mockResolvedValue({ data: MOCK_METRICS, error: null });
    await fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.metrics()).toEqual(MOCK_METRICS);
  });

  it('formatCurrency() formats pesos with es-AR locale', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const result = fixture.componentInstance.formatCurrency(15000);
    expect(result).toContain('15');
    expect(result).toContain('000');
    expect(result.startsWith('$')).toBe(true);
  });

  it('formatCurrency() handles zero', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    expect(fixture.componentInstance.formatCurrency(0)).toBe('$0');
  });

  it('goBack() navigates to /staff', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/staff']);
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });

  // ── Upload handler ────────────────────────────────────────────────────────

  it('onFileSelected() sets uploadResult with the returned URL on success', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const file = new File(['data'], 'burger.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await fixture.componentInstance.onFileSelected(event);

    expect(fixture.componentInstance.uploadResult()).toBe(UPLOAD_URL);
    expect(fixture.componentInstance.uploadError()).toBeNull();
  });

  it('onFileSelected() sets uploadError and keeps uploadResult null on failure', async () => {
    const storageStub = TestBed.inject(StorageService) as unknown as StorageServiceStub;
    storageStub.uploadProductImage = vi
      .fn()
      .mockRejectedValue(new Error('Tipo de archivo no permitido.'));

    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await fixture.componentInstance.onFileSelected(event);

    expect(fixture.componentInstance.uploadError()).toContain('Tipo de archivo no permitido');
    expect(fixture.componentInstance.uploadResult()).toBeNull();
  });

  it('onFileSelected() clears a previous result before a new upload', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.componentInstance.uploadResult.set('https://old-url.example.com/img.jpg');

    const file = new File(['data'], 'new.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await fixture.componentInstance.onFileSelected(event);

    expect(fixture.componentInstance.uploadResult()).toBe(UPLOAD_URL);
  });

  it('onFileSelected() sets uploading to false after completion', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const file = new File(['data'], 'burger.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await fixture.componentInstance.onFileSelected(event);

    expect(fixture.componentInstance.uploading()).toBe(false);
  });

  it('onFileSelected() does nothing when no file is selected', async () => {
    const storageStub = TestBed.inject(StorageService) as unknown as StorageServiceStub;
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const event = { target: { files: [], value: '' } } as unknown as Event;

    await fixture.componentInstance.onFileSelected(event);

    expect(storageStub.uploadProductImage).not.toHaveBeenCalled();
  });
});
