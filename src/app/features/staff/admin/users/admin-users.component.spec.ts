import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminUsersComponent, ROLE_LABELS } from './admin-users.component';
import type { StaffMember, StaffRole } from './admin-users.component';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import type { StaffProfile } from '../../../../core/services/auth.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_STAFF: StaffMember[] = [
  { id: 'u1', name: 'Ana López', role: 'admin', is_active: true },
  { id: 'u2', name: 'Carlos Gómez', role: 'kitchen', is_active: true },
  { id: 'u3', name: 'Diana Ruiz', role: 'cashier', is_active: false },
];

const MOCK_CREATED: { id: string; email: string; name: string; role: StaffRole } = {
  id: 'u4',
  email: 'new@test.com',
  name: 'Nuevo Usuario',
  role: 'kitchen',
};

// ── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(resolveValue: unknown): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: (
      onfulfilled?: (v: unknown) => unknown,
      onrejected?: (r: unknown) => unknown,
    ) => Promise.resolve(resolveValue).then(onfulfilled, onrejected),
  };
  return chain;
}

class SupabaseClientServiceStub {
  fromResolve: unknown = { data: MOCK_STAFF, error: null };
  functionsInvokeResolve: unknown = { data: MOCK_CREATED, error: null };

  client = {
    from: vi.fn().mockImplementation((_table: string) =>
      makeChain(this.fromResolve),
    ),
    functions: {
      invoke: vi.fn().mockImplementation(
        () => Promise.resolve(this.functionsInvokeResolve),
      ),
    },
  };
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Admin Test', role: 'admin' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminUsersComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in list view', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    expect(fixture.componentInstance.view()).toBe('list');
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  it('should populate staff after successful init', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.staff()).toEqual(MOCK_STAFF);
  });

  it('should set isLoading to false after init', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.isLoading()).toBe(false);
  });

  it('should set hasError when query fails', async () => {
    supabaseStub.fromResolve = { data: null, error: { message: 'DB error' } };
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.hasError()).toBe(true);
  });

  // ── Computed ───────────────────────────────────────────────────────────────

  it('activeCount counts only active members', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    // MOCK_STAFF: u1 active, u2 active, u3 inactive → 2
    expect(c.activeCount()).toBe(2);
  });

  // ── openCreate ────────────────────────────────────────────────────────────

  it('openCreate() switches to form view', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.openCreate();
    expect(c.view()).toBe('form');
  });

  it('openCreate() resets all form fields', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('old name');
    c.fEmail.set('old@test.com');
    c.fPassword.set('oldpass123');
    c.fRole.set('admin');
    c.openCreate();
    expect(c.fName()).toBe('');
    expect(c.fEmail()).toBe('');
    expect(c.fPassword()).toBe('');
    expect(c.fRole()).toBe('kitchen');
  });

  it('openCreate() resets triedSave and saveError', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.triedSave.set(true);
    c.saveError.set('previous error');
    c.openCreate();
    expect(c.triedSave()).toBe(false);
    expect(c.saveError()).toBeNull();
  });

  // ── cancelForm ────────────────────────────────────────────────────────────

  it('cancelForm() returns to list view', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.openCreate();
    c.cancelForm();
    expect(c.view()).toBe('list');
  });

  // ── formErrors ────────────────────────────────────────────────────────────

  it('formErrors: empty when all fields are valid', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('Ana López');
    c.fEmail.set('ana@test.com');
    c.fPassword.set('password123');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('formErrors: error when name is empty', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('');
    c.fEmail.set('ana@test.com');
    c.fPassword.set('password123');
    expect(c.formErrors().some(e => e.includes('nombre'))).toBe(true);
  });

  it('formErrors: error when email is empty', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('Ana');
    c.fEmail.set('');
    c.fPassword.set('password123');
    expect(c.formErrors().some(e => e.includes('email'))).toBe(true);
  });

  it('formErrors: error when email format is invalid', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('Ana');
    c.fEmail.set('not-an-email');
    c.fPassword.set('password123');
    expect(c.formErrors().some(e => e.includes('email'))).toBe(true);
  });

  it('formErrors: error when password is shorter than 8 chars', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('Ana');
    c.fEmail.set('ana@test.com');
    c.fPassword.set('short');
    expect(c.formErrors().some(e => e.includes('contraseña'))).toBe(true);
  });

  it('formErrors: no password error at exactly 8 chars', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('Ana');
    c.fEmail.set('ana@test.com');
    c.fPassword.set('12345678');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('visibleErrors: empty before first save attempt', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('');
    expect(c.visibleErrors()).toHaveLength(0);
  });

  it('visibleErrors: shows errors after save attempt with invalid data', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('');
    await c.saveForm();
    expect(c.visibleErrors().length).toBeGreaterThan(0);
  });

  // ── saveForm — validation ─────────────────────────────────────────────────

  it('saveForm() does not call functions.invoke when validation fails', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.fName.set('');
    await c.saveForm();
    expect(supabaseStub.client.functions.invoke).not.toHaveBeenCalled();
  });

  it('saveForm() stays in form view when validation fails', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    c.openCreate();
    await c.saveForm();
    expect(c.view()).toBe('form');
  });

  // ── saveForm — success ────────────────────────────────────────────────────

  it('saveForm() calls functions.invoke with correct payload', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('new@test.com');
    c.fPassword.set('password123');
    c.fRole.set('kitchen');

    await c.saveForm();

    expect(supabaseStub.client.functions.invoke).toHaveBeenCalledWith(
      'create-staff-user',
      {
        body: {
          email: 'new@test.com',
          name: 'Nuevo Usuario',
          password: 'password123',
          role: 'kitchen',
        },
      },
    );
  });

  it('saveForm() adds new member to staff list on success', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('new@test.com');
    c.fPassword.set('password123');

    await c.saveForm();

    expect(c.staff().some(s => s.id === 'u4')).toBe(true);
  });

  it('saveForm() new member is marked is_active true', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('new@test.com');
    c.fPassword.set('password123');

    await c.saveForm();

    const created = c.staff().find(s => s.id === 'u4');
    expect(created?.is_active).toBe(true);
  });

  it('saveForm() returns to list view on success', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('new@test.com');
    c.fPassword.set('password123');

    await c.saveForm();

    expect(c.view()).toBe('list');
  });

  // ── saveForm — error ──────────────────────────────────────────────────────

  it('saveForm() sets saveError when function call fails', async () => {
    supabaseStub.functionsInvokeResolve = {
      data: null,
      error: { message: 'El email ya está en uso.' },
    };
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('existing@test.com');
    c.fPassword.set('password123');

    await c.saveForm();

    expect(c.saveError()).toBeTruthy();
  });

  it('saveForm() stays in form view when function call fails', async () => {
    supabaseStub.functionsInvokeResolve = {
      data: null,
      error: { message: 'Error' },
    };
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('new@test.com');
    c.fPassword.set('password123');

    await c.saveForm();

    expect(c.view()).toBe('form');
  });

  it('saveForm() sets saving to false after completion (success)', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('new@test.com');
    c.fPassword.set('password123');

    await c.saveForm();

    expect(c.saving()).toBe(false);
  });

  it('saveForm() sets saving to false after completion (error)', async () => {
    supabaseStub.functionsInvokeResolve = { data: null, error: { message: 'Error' } };
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Usuario');
    c.fEmail.set('new@test.com');
    c.fPassword.set('password123');

    await c.saveForm();

    expect(c.saving()).toBe(false);
  });

  // ── toggleActive ──────────────────────────────────────────────────────────

  it('toggleActive() deactivates an active member', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_STAFF.find(s => s.is_active)!;

    await c.toggleActive(active);

    expect(c.staff().find(s => s.id === active.id)?.is_active).toBe(false);
  });

  it('toggleActive() activates an inactive member', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    const inactive = MOCK_STAFF.find(s => !s.is_active)!;

    await c.toggleActive(inactive);

    expect(c.staff().find(s => s.id === inactive.id)?.is_active).toBe(true);
  });

  it('toggleActive() clears togglingId after completion', async () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_STAFF.find(s => s.is_active)!;

    await c.toggleActive(active);

    expect(c.togglingId()).toBeNull();
  });

  it('toggleActive() does not update list when update fails', async () => {
    supabaseStub.fromResolve = { data: null, error: { message: 'DB error' } };
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    // Manually set staff to avoid ngOnInit triggering the error path
    c.staff.set([...MOCK_STAFF]);
    supabaseStub.fromResolve = { data: null, error: { message: 'Update error' } };

    const original = c.staff().find(s => s.id === 'u1')!.is_active;
    await c.toggleActive(MOCK_STAFF[0]);

    expect(c.staff().find(s => s.id === 'u1')?.is_active).toBe(original);
  });

  // ── roleLabel ─────────────────────────────────────────────────────────────

  it('roleLabel() returns correct label for kitchen', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    expect(c.roleLabel('kitchen')).toBe(ROLE_LABELS.kitchen);
  });

  it('roleLabel() returns correct label for cashier', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    expect(c.roleLabel('cashier')).toBe(ROLE_LABELS.cashier);
  });

  it('roleLabel() returns correct label for admin', () => {
    const c = TestBed.createComponent(AdminUsersComponent).componentInstance;
    expect(c.roleLabel('admin')).toBe(ROLE_LABELS.admin);
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('goBack() navigates to /staff/admin', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/admin']);
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });
});
