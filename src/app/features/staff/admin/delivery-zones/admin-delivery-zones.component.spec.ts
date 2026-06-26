import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminDeliveryZonesComponent } from './admin-delivery-zones.component';
import type { AdminDeliveryZone } from './admin-delivery-zones.component';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import type { StaffProfile } from '../../../../core/services/auth.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_ZONES: AdminDeliveryZone[] = [
  { id: 'centro', name: 'Centro', cost: 500, is_active: true, sort_order: 1 },
  { id: 'norte', name: 'Norte', cost: 800, is_active: true, sort_order: 2 },
  { id: 'sur', name: 'Sur', cost: 600, is_active: false, sort_order: 3 },
];

const MOCK_NEW_ZONE: AdminDeliveryZone = {
  id: 'oeste',
  name: 'Oeste',
  cost: 700,
  is_active: true,
  sort_order: 4,
};

// ── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(awaitResolve: unknown, singleResolve?: unknown): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResolve ?? awaitResolve),
    then: (
      onfulfilled?: (v: unknown) => unknown,
      onrejected?: (r: unknown) => unknown,
    ) => Promise.resolve(awaitResolve).then(onfulfilled, onrejected),
  };
  return chain;
}

class SupabaseClientServiceStub {
  zonesResolve: unknown = { data: MOCK_ZONES, error: null };
  zoneSingleResolve: unknown = { data: MOCK_NEW_ZONE, error: null };

  client = {
    from: vi.fn().mockImplementation((_table: string) =>
      makeChain(this.zonesResolve, this.zoneSingleResolve),
    ),
  };
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Admin Test', role: 'admin' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminDeliveryZonesComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [AdminDeliveryZonesComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in list view', () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    expect(fixture.componentInstance.view()).toBe('list');
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  it('should populate zones after successful init', async () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.zones()).toEqual(MOCK_ZONES);
  });

  it('should set isLoading to false after init', async () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should set hasError when query fails', async () => {
    supabaseStub.zonesResolve = { data: null, error: { message: 'DB error' } };
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.hasError()).toBe(true);
  });

  // ── Computed ───────────────────────────────────────────────────────────────

  it('activeCount counts only active zones', async () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    await fixture.componentInstance.ngOnInit();
    // MOCK_ZONES has 2 active and 1 inactive
    expect(fixture.componentInstance.activeCount()).toBe(2);
  });

  // ── openCreate ────────────────────────────────────────────────────────────

  it('openCreate() switches to form view', () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.view()).toBe('form');
  });

  it('openCreate() resets all form fields', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.fName.set('old');
    c.fCost.set('999');
    c.openCreate();
    expect(c.fName()).toBe('');
    expect(c.fCost()).toBe('0');
    expect(c.fIsActive()).toBe(true);
    expect(c.editingZone()).toBeNull();
  });

  it('openCreate() resets triedSave', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.triedSave.set(true);
    c.openCreate();
    expect(c.triedSave()).toBe(false);
  });

  // ── openEdit ──────────────────────────────────────────────────────────────

  it('openEdit() populates form fields from zone', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.openEdit(MOCK_ZONES[0]);
    expect(c.fName()).toBe('Centro');
    expect(c.fCost()).toBe('500');
    expect(c.fIsActive()).toBe(true);
    expect(c.editingZone()).toEqual(MOCK_ZONES[0]);
    expect(c.view()).toBe('form');
  });

  it('openEdit() resets triedSave', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.triedSave.set(true);
    c.openEdit(MOCK_ZONES[0]);
    expect(c.triedSave()).toBe(false);
  });

  // ── cancelForm ────────────────────────────────────────────────────────────

  it('cancelForm() returns to list view', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.openCreate();
    c.cancelForm();
    expect(c.view()).toBe('list');
    expect(c.editingZone()).toBeNull();
  });

  // ── formErrors (validation) ───────────────────────────────────────────────

  it('formErrors returns error when name is empty', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.fName.set('');
    expect(c.formErrors().some(e => e.includes('nombre'))).toBe(true);
  });

  it('formErrors returns error when cost is negative', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.fName.set('Centro');
    c.fCost.set('-1');
    expect(c.formErrors().some(e => e.includes('costo'))).toBe(true);
  });

  it('formErrors allows cost of 0 (free shipping zone)', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.fName.set('Centro');
    c.fCost.set('0');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('formErrors is empty when all required fields are valid', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.fName.set('Centro');
    c.fCost.set('500');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('visibleErrors is empty before first save attempt', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.fName.set('');
    expect(c.visibleErrors()).toHaveLength(0);
  });

  it('visibleErrors shows errors after first save attempt', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    c.fName.set('');
    await c.saveForm();
    expect(c.visibleErrors().length).toBeGreaterThan(0);
  });

  // ── saveForm — create ─────────────────────────────────────────────────────

  it('saveForm() inserts zone and adds it to list', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Oeste');
    c.fCost.set('700');

    await c.saveForm();

    expect(c.zones().some(z => z.id === 'oeste')).toBe(true);
    expect(c.view()).toBe('list');
  });

  it('saveForm() returns to list view and clears editingZone on create success', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Oeste');
    c.fCost.set('700');

    await c.saveForm();

    expect(c.view()).toBe('list');
    expect(c.editingZone()).toBeNull();
  });

  it('saveForm() shows duplicate-key error when ID conflicts', async () => {
    supabaseStub.zoneSingleResolve = {
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    };
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Centro');
    c.fCost.set('500');

    await c.saveForm();

    expect(c.saveError()).toMatch(/nombre diferente/);
    expect(c.view()).toBe('form');
  });

  it('saveForm() sets saveError on generic DB failure during create', async () => {
    supabaseStub.zoneSingleResolve = {
      data: null,
      error: { code: '500', message: 'Server error' },
    };
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Oeste');
    c.fCost.set('700');

    await c.saveForm();

    expect(c.saveError()).toBeTruthy();
    expect(c.view()).toBe('form');
  });

  // ── saveForm — edit ───────────────────────────────────────────────────────

  it('saveForm() updates zone name and cost in list', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    c.openEdit(MOCK_ZONES[0]);
    c.fName.set('Centro Ampliado');
    c.fCost.set('550');

    await c.saveForm();

    const updated = c.zones().find(z => z.id === 'centro');
    expect(updated?.name).toBe('Centro Ampliado');
    expect(updated?.cost).toBe(550);
    expect(c.view()).toBe('list');
  });

  it('saveForm() preserves sort_order when editing', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    c.openEdit(MOCK_ZONES[0]); // sort_order: 1
    c.fName.set('Centro');
    c.fCost.set('600');

    await c.saveForm();

    const updated = c.zones().find(z => z.id === 'centro');
    expect(updated?.sort_order).toBe(1);
  });

  // ── toggleActive ──────────────────────────────────────────────────────────

  it('toggleActive() deactivates an active zone', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_ZONES.find(z => z.is_active)!;

    await c.toggleActive(active);

    const updated = c.zones().find(z => z.id === active.id);
    expect(updated?.is_active).toBe(false);
  });

  it('toggleActive() activates an inactive zone', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    const inactive = MOCK_ZONES.find(z => !z.is_active)!;

    await c.toggleActive(inactive);

    const updated = c.zones().find(z => z.id === inactive.id);
    expect(updated?.is_active).toBe(true);
  });

  it('togglingId is cleared after toggle completes', async () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_ZONES.find(z => z.is_active)!;

    await c.toggleActive(active);

    expect(c.togglingId()).toBeNull();
  });

  // ── formatCurrency ────────────────────────────────────────────────────────

  it('formatCurrency() returns a string starting with $', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    expect(c.formatCurrency(500).startsWith('$')).toBe(true);
  });

  it('formatCurrency() formats 0 without error', () => {
    const c = TestBed.createComponent(AdminDeliveryZonesComponent).componentInstance;
    expect(c.formatCurrency(0)).toBe('$0');
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('goBack() navigates to /staff/admin', () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/admin']);
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(AdminDeliveryZonesComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });
});
