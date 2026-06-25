import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminDashboardComponent } from './admin-dashboard.component';
import type { DashboardMetrics } from './admin-dashboard.component';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import type { StaffProfile } from '../../../../core/services/auth.service';

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
});
