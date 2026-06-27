import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminCategoriesComponent } from './admin-categories.component';
import type { AdminCategory } from './admin-categories.component';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import type { StaffProfile } from '../../../../core/services/auth.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: AdminCategory[] = [
  {
    id: 'hamburguesas',
    name: 'Hamburguesas',
    description: 'Hamburguesas de la casa',
    sort_order: 1,
    is_active: true,
    image_url: null,
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    description: 'Bebidas y refrescos',
    sort_order: 3,
    is_active: true,
    image_url: null,
  },
  {
    id: 'combos',
    name: 'Combos',
    description: 'Combos especiales',
    sort_order: 4,
    is_active: false,
    image_url: null,
  },
];

const MOCK_NEW_CATEGORY: AdminCategory = {
  id: 'postres',
  name: 'Postres',
  description: null,
  sort_order: 10,
  is_active: true,
  image_url: null,
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
  categoriesResolve: unknown = { data: MOCK_CATEGORIES, error: null };
  categorySingleResolve: unknown = { data: MOCK_NEW_CATEGORY, error: null };
  productsCountResolve: unknown = { count: 0, error: null };

  client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'categories')
        return makeChain(this.categoriesResolve, this.categorySingleResolve);
      if (table === 'products')
        return makeChain(this.productsCountResolve);
      return makeChain({ data: null, error: null });
    }),
  };
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Admin Test', role: 'admin' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminCategoriesComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [AdminCategoriesComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in list view', () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    expect(fixture.componentInstance.view()).toBe('list');
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  it('should populate categories after successful init', async () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.categories()).toEqual(MOCK_CATEGORIES);
  });

  it('should set isLoading to false after init', async () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should set hasError when query fails', async () => {
    supabaseStub.categoriesResolve = { data: null, error: { message: 'DB error' } };
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.hasError()).toBe(true);
  });

  // ── Computed ───────────────────────────────────────────────────────────────

  it('activeCount counts only active categories', async () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    await fixture.componentInstance.ngOnInit();
    // MOCK_CATEGORIES has 2 active and 1 inactive
    expect(fixture.componentInstance.activeCount()).toBe(2);
  });

  // ── openCreate ────────────────────────────────────────────────────────────

  it('openCreate() switches to form view', () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.view()).toBe('form');
  });

  it('openCreate() resets all form fields', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.fName.set('old');
    c.fDesc.set('old desc');
    c.openCreate();
    expect(c.fName()).toBe('');
    expect(c.fDesc()).toBe('');
    expect(c.fIsActive()).toBe(true);
    expect(c.editingCategory()).toBeNull();
  });

  it('openCreate() resets triedSave', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.triedSave.set(true);
    c.openCreate();
    expect(c.triedSave()).toBe(false);
  });

  // ── openEdit ──────────────────────────────────────────────────────────────

  it('openEdit() populates form fields from category', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.openEdit(MOCK_CATEGORIES[0]);
    expect(c.fName()).toBe('Hamburguesas');
    expect(c.fDesc()).toBe('Hamburguesas de la casa');
    expect(c.fSortOrder()).toBe('1');
    expect(c.fIsActive()).toBe(true);
    expect(c.editingCategory()).toEqual(MOCK_CATEGORIES[0]);
    expect(c.view()).toBe('form');
  });

  it('openEdit() maps null description to empty string', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    const catWithNullDesc: AdminCategory = { ...MOCK_CATEGORIES[0], description: null };
    c.openEdit(catWithNullDesc);
    expect(c.fDesc()).toBe('');
  });

  // ── cancelForm ────────────────────────────────────────────────────────────

  it('cancelForm() returns to list view', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.openCreate();
    c.cancelForm();
    expect(c.view()).toBe('list');
    expect(c.editingCategory()).toBeNull();
  });

  // ── formErrors (validation) ───────────────────────────────────────────────

  it('formErrors returns error when name is empty', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.fName.set('');
    expect(c.formErrors().some(e => e.includes('nombre'))).toBe(true);
  });

  it('formErrors returns error when sort_order is negative', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.fName.set('Test');
    c.fSortOrder.set('-1');
    expect(c.formErrors().some(e => e.includes('orden'))).toBe(true);
  });

  it('formErrors is empty when all required fields are valid', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.fName.set('Hamburguesas');
    c.fSortOrder.set('1');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('visibleErrors is empty before first save attempt', () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.fName.set('');
    expect(c.visibleErrors()).toHaveLength(0);
  });

  it('visibleErrors shows errors after first save attempt', async () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    c.fName.set('');
    await c.saveForm();
    expect(c.visibleErrors().length).toBeGreaterThan(0);
  });

  // ── saveForm — create ─────────────────────────────────────────────────────

  it('saveForm() inserts category and adds it to list', async () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Postres');
    c.fSortOrder.set('10');

    await c.saveForm();

    expect(c.categories().some(cat => cat.id === 'postres')).toBe(true);
    expect(c.view()).toBe('list');
  });

  it('saveForm() returns to list view on success', async () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Postres');
    c.fSortOrder.set('10');

    await c.saveForm();

    expect(c.view()).toBe('list');
    expect(c.editingCategory()).toBeNull();
  });

  it('saveForm() shows duplicate-key error when ID conflicts', async () => {
    supabaseStub.categorySingleResolve = {
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    };
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Hamburguesas');
    c.fSortOrder.set('1');

    await c.saveForm();

    expect(c.saveError()).toMatch(/nombre diferente/);
    expect(c.view()).toBe('form');
  });

  it('saveForm() sets saveError on generic DB failure', async () => {
    supabaseStub.categorySingleResolve = {
      data: null,
      error: { code: '500', message: 'Server error' },
    };
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Postres');
    c.fSortOrder.set('10');

    await c.saveForm();

    expect(c.saveError()).toBeTruthy();
    expect(c.view()).toBe('form');
  });

  // ── saveForm — edit ───────────────────────────────────────────────────────

  it('saveForm() edit updates category in list', async () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    c.openEdit(MOCK_CATEGORIES[0]);
    c.fName.set('Hamburguesas Especiales');
    c.fSortOrder.set('2');

    await c.saveForm();

    const updated = c.categories().find(cat => cat.id === 'hamburguesas');
    expect(updated?.name).toBe('Hamburguesas Especiales');
    expect(updated?.sort_order).toBe(2);
    expect(c.view()).toBe('list');
  });

  it('saveForm() maps empty description to null on save', async () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    c.openEdit(MOCK_CATEGORIES[0]);
    c.fName.set('Hamburguesas');
    c.fDesc.set('');
    c.fSortOrder.set('1');

    await c.saveForm();

    const updated = c.categories().find(cat => cat.id === 'hamburguesas');
    expect(updated?.description).toBeNull();
  });

  // ── requestToggleActive — activate (no warning) ───────────────────────────

  it('requestToggleActive() directly activates an inactive category', async () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    const inactive = MOCK_CATEGORIES.find(cat => !cat.is_active)!;

    await c.requestToggleActive(inactive);

    expect(c.pendingDeactivation()).toBeNull();
    const updated = c.categories().find(cat => cat.id === inactive.id);
    expect(updated?.is_active).toBe(true);
  });

  // ── requestToggleActive — deactivate without active products ──────────────

  it('requestToggleActive() deactivates directly when no active products', async () => {
    supabaseStub.productsCountResolve = { count: 0, error: null };
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_CATEGORIES.find(cat => cat.is_active)!;

    await c.requestToggleActive(active);

    expect(c.pendingDeactivation()).toBeNull();
    const updated = c.categories().find(cat => cat.id === active.id);
    expect(updated?.is_active).toBe(false);
  });

  // ── requestToggleActive — deactivate with active products (warning) ───────

  it('requestToggleActive() sets pendingDeactivation when active products exist', async () => {
    supabaseStub.productsCountResolve = { count: 3, error: null };
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_CATEGORIES.find(cat => cat.is_active)!;

    await c.requestToggleActive(active);

    const pending = c.pendingDeactivation();
    expect(pending).not.toBeNull();
    expect(pending!.category.id).toBe(active.id);
    expect(pending!.activeProductCount).toBe(3);
    // category is NOT yet deactivated
    const updated = c.categories().find(cat => cat.id === active.id);
    expect(updated?.is_active).toBe(true);
  });

  it('checkingDeactivation is cleared after requestToggleActive', async () => {
    supabaseStub.productsCountResolve = { count: 2, error: null };
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_CATEGORIES.find(cat => cat.is_active)!;

    await c.requestToggleActive(active);

    expect(c.checkingDeactivation()).toBeNull();
  });

  // ── confirmDeactivation ───────────────────────────────────────────────────

  it('confirmDeactivation() deactivates and clears pendingDeactivation', async () => {
    supabaseStub.productsCountResolve = { count: 2, error: null };
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_CATEGORIES.find(cat => cat.is_active)!;
    await c.requestToggleActive(active); // sets pendingDeactivation

    await c.confirmDeactivation();

    expect(c.pendingDeactivation()).toBeNull();
    const updated = c.categories().find(cat => cat.id === active.id);
    expect(updated?.is_active).toBe(false);
  });

  // ── cancelDeactivation ────────────────────────────────────────────────────

  it('cancelDeactivation() clears pendingDeactivation without toggling', async () => {
    supabaseStub.productsCountResolve = { count: 2, error: null };
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    const active = MOCK_CATEGORIES.find(cat => cat.is_active)!;
    await c.requestToggleActive(active); // sets pendingDeactivation

    c.cancelDeactivation();

    expect(c.pendingDeactivation()).toBeNull();
    const notToggled = c.categories().find(cat => cat.id === active.id);
    expect(notToggled?.is_active).toBe(true);
  });

  // ── togglingId ────────────────────────────────────────────────────────────

  it('togglingId is cleared after toggle completes', async () => {
    const c = TestBed.createComponent(AdminCategoriesComponent).componentInstance;
    await c.ngOnInit();
    const inactive = MOCK_CATEGORIES.find(cat => !cat.is_active)!;

    await c.requestToggleActive(inactive);

    expect(c.togglingId()).toBeNull();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('goBack() navigates to /staff/admin', () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/admin']);
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(AdminCategoriesComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });
});
