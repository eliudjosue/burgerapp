import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AdminProductsComponent } from './admin-products.component';
import type { AdminProduct, AdminCategory } from './admin-products.component';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import type { StaffProfile } from '../../../../core/services/auth.service';
import { StorageService } from '../../../../core/services/storage.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: AdminProduct[] = [
  {
    id: 'prod-1',
    name: 'Hamburguesa Clásica',
    description: 'La clásica con todo',
    price: 1500,
    category_id: 'hamburguesas',
    image_url: null,
    is_active: true,
    is_combo: false,
    sort_order: 0,
  },
  {
    id: 'prod-2',
    name: 'Papas Fritas',
    description: 'Papas crujientes',
    price: 500,
    category_id: 'acompanamentos',
    image_url: null,
    is_active: false,
    is_combo: false,
    sort_order: 1,
  },
  {
    id: 'prod-combo',
    name: 'Combo Clásico',
    description: 'Hamburguesa + papas',
    price: 1800,
    category_id: 'combos',
    image_url: null,
    is_active: true,
    is_combo: true,
    sort_order: 2,
  },
];

const MOCK_CATEGORIES: AdminCategory[] = [
  { id: 'hamburguesas', name: 'Hamburguesas' },
  { id: 'acompanamentos', name: 'Acompañamientos' },
  { id: 'combos', name: 'Combos' },
];

const MOCK_NEW_PRODUCT: AdminProduct = {
  id: 'new-id',
  name: 'Nuevo Producto',
  description: 'Descripción nueva',
  price: 2000,
  category_id: 'hamburguesas',
  image_url: null,
  is_active: true,
  is_combo: false,
  sort_order: 0,
};

const MOCK_COMBO_ITEMS = [
  { product_id: 'prod-1', quantity: 1 },
  { product_id: 'prod-2', quantity: 1 },
];

const UPLOAD_URL =
  'https://project.supabase.co/storage/v1/object/public/product-images/products/uuid.jpg';

// ── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(awaitResolve: unknown, singleResolve?: unknown): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResolve ?? awaitResolve),
    maybeSingle: vi.fn().mockResolvedValue(singleResolve ?? awaitResolve),
    then: (
      onfulfilled?: (v: unknown) => unknown,
      onrejected?: (r: unknown) => unknown,
    ) => Promise.resolve(awaitResolve).then(onfulfilled, onrejected),
  };
  return chain;
}

class SupabaseClientServiceStub {
  productsResolve: unknown = { data: MOCK_PRODUCTS, error: null };
  categoriesResolve: unknown = { data: MOCK_CATEGORIES, error: null };
  comboItemsResolve: unknown = { data: MOCK_COMBO_ITEMS, error: null };
  productSingleResolve: unknown = { data: MOCK_NEW_PRODUCT, error: null };

  client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'products')
        return makeChain(this.productsResolve, this.productSingleResolve);
      if (table === 'categories')
        return makeChain(this.categoriesResolve);
      if (table === 'combo_items')
        return makeChain(this.comboItemsResolve);
      return makeChain({ data: null, error: null });
    }),
  };
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Admin Test', role: 'admin' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

class StorageServiceStub {
  uploadProductImage = vi.fn().mockResolvedValue(UPLOAD_URL);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminProductsComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [AdminProductsComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: StorageService, useClass: StorageServiceStub },
      ],
    }).compileComponents();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in list view', () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    expect(fixture.componentInstance.view()).toBe('list');
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  it('should populate products and categories after successful init', async () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.products()).toEqual(MOCK_PRODUCTS);
    expect(fixture.componentInstance.categories()).toEqual(MOCK_CATEGORIES);
  });

  it('should set isLoading to false after init', async () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should set hasError when products query fails', async () => {
    supabaseStub.productsResolve = { data: null, error: { message: 'DB error' } };
    const fixture = TestBed.createComponent(AdminProductsComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.hasError()).toBe(true);
  });

  // ── List computed ──────────────────────────────────────────────────────────

  it('activeCount computed counts only active products', async () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    await fixture.componentInstance.ngOnInit();
    // MOCK_PRODUCTS has 2 active (prod-1, prod-combo) and 1 inactive (prod-2)
    expect(fixture.componentInstance.activeCount()).toBe(2);
  });

  it('nonComboProducts excludes combos and the product being edited', async () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.editingProduct.set(MOCK_PRODUCTS[0]);
    const result = fixture.componentInstance.nonComboProducts();
    expect(result.every(p => !p.is_combo)).toBe(true);
    expect(result.find(p => p.id === 'prod-1')).toBeUndefined();
  });

  // ── openCreate ────────────────────────────────────────────────────────────

  it('openCreate() switches to form view', () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.view()).toBe('form');
  });

  it('openCreate() resets all form fields', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('old');
    c.fPrice.set('999');
    c.fIsCombo.set(true);
    c.openCreate();
    expect(c.fName()).toBe('');
    expect(c.fPrice()).toBe('');
    expect(c.fIsCombo()).toBe(false);
    expect(c.editingProduct()).toBeNull();
  });

  it('openCreate() resets triedSave', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.triedSave.set(true);
    c.openCreate();
    expect(c.triedSave()).toBe(false);
  });

  // ── openEdit ──────────────────────────────────────────────────────────────

  it('openEdit() populates form fields from product', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.openEdit(MOCK_PRODUCTS[0]);
    expect(c.fName()).toBe('Hamburguesa Clásica');
    expect(c.fPrice()).toBe('1500');
    expect(c.fCategoryId()).toBe('hamburguesas');
    expect(c.fIsActive()).toBe(true);
    expect(c.fIsCombo()).toBe(false);
    expect(c.editingProduct()).toEqual(MOCK_PRODUCTS[0]);
    expect(c.view()).toBe('form');
  });

  it('openEdit() loads combo items for a combo product', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.openEdit(MOCK_PRODUCTS[2]); // prod-combo
    expect(c.fComboItems().length).toBe(2);
    expect(c.fComboItems()[0].product_id).toBe('prod-1');
  });

  it('openEdit() does not load combo items for a non-combo product', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.openEdit(MOCK_PRODUCTS[0]);
    expect(supabaseStub.client.from).not.toHaveBeenCalledWith('combo_items');
  });

  // ── cancelForm ────────────────────────────────────────────────────────────

  it('cancelForm() returns to list view', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.openCreate();
    c.cancelForm();
    expect(c.view()).toBe('list');
    expect(c.editingProduct()).toBeNull();
  });

  // ── formErrors (validation) ───────────────────────────────────────────────

  it('formErrors returns error when name is empty', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('');
    c.fDesc.set('desc');
    c.fPrice.set('100');
    c.fCategoryId.set('hamburguesas');
    expect(c.formErrors().some(e => e.includes('nombre'))).toBe(true);
  });

  it('formErrors returns error when description is empty', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('Prod');
    c.fDesc.set('');
    c.fPrice.set('100');
    c.fCategoryId.set('hamburguesas');
    expect(c.formErrors().some(e => e.includes('descripción'))).toBe(true);
  });

  it('formErrors returns error when price is not a positive number', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('Prod');
    c.fDesc.set('desc');
    c.fPrice.set('-5');
    c.fCategoryId.set('hamburguesas');
    expect(c.formErrors().some(e => e.includes('precio'))).toBe(true);
  });

  it('formErrors returns error when category is empty', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('Prod');
    c.fDesc.set('desc');
    c.fPrice.set('100');
    c.fCategoryId.set('');
    expect(c.formErrors().some(e => e.includes('categoría'))).toBe(true);
  });

  it('formErrors returns error when combo has no items', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('Combo');
    c.fDesc.set('desc');
    c.fPrice.set('1000');
    c.fCategoryId.set('combos');
    c.fIsCombo.set(true);
    c.fComboItems.set([]);
    expect(c.formErrors().some(e => e.includes('combo'))).toBe(true);
  });

  it('formErrors is empty when all fields are valid', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('Hamburguesa');
    c.fDesc.set('Descripción');
    c.fPrice.set('1500');
    c.fCategoryId.set('hamburguesas');
    expect(c.formErrors()).toHaveLength(0);
  });

  it('visibleErrors is empty before first save attempt', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('');
    expect(c.visibleErrors()).toHaveLength(0);
  });

  it('visibleErrors shows errors after first save attempt', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fName.set('');
    await c.saveForm();
    expect(c.visibleErrors().length).toBeGreaterThan(0);
  });

  // ── saveForm — create ─────────────────────────────────────────────────────

  it('saveForm() inserts product and prepends it to list', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Nuevo Producto');
    c.fDesc.set('Descripción');
    c.fPrice.set('2000');
    c.fCategoryId.set('hamburguesas');

    await c.saveForm();

    expect(c.products()[0]).toEqual(MOCK_NEW_PRODUCT);
    expect(c.view()).toBe('list');
  });

  it('saveForm() returns to list view on success', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Prod');
    c.fDesc.set('Desc');
    c.fPrice.set('500');
    c.fCategoryId.set('hamburguesas');

    await c.saveForm();

    expect(c.view()).toBe('list');
    expect(c.editingProduct()).toBeNull();
  });

  it('saveForm() create also inserts combo items when is_combo', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Combo');
    c.fDesc.set('Desc');
    c.fPrice.set('2000');
    c.fCategoryId.set('combos');
    c.fIsCombo.set(true);
    c.addComboItem();
    c.updateComboItemProduct(c.fComboItems()[0].localId, 'prod-1');

    await c.saveForm();

    const comboInsertCalls = supabaseStub.client.from.mock.calls.filter(
      (args: unknown[]) => args[0] === 'combo_items',
    );
    expect(comboInsertCalls.length).toBeGreaterThan(0);
  });

  it('saveForm() sets saveError on DB failure', async () => {
    supabaseStub.productSingleResolve = { data: null, error: { message: 'Unauthorized' } };
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();
    c.openCreate();
    c.fName.set('Prod');
    c.fDesc.set('Desc');
    c.fPrice.set('500');
    c.fCategoryId.set('hamburguesas');

    await c.saveForm();

    expect(c.saveError()).toBeTruthy();
    expect(c.view()).toBe('form');
  });

  // ── saveForm — edit ───────────────────────────────────────────────────────

  it('saveForm() edit updates product in list', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();
    await c.openEdit(MOCK_PRODUCTS[0]);
    c.fName.set('Hamburguesa Editada');
    c.fPrice.set('1600');

    await c.saveForm();

    const updated = c.products().find(p => p.id === 'prod-1');
    expect(updated?.name).toBe('Hamburguesa Editada');
    expect(updated?.price).toBe(1600);
    expect(c.view()).toBe('list');
  });

  // ── toggleActive ──────────────────────────────────────────────────────────

  it('toggleActive() flips is_active and updates list', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();

    await c.toggleActive(MOCK_PRODUCTS[0]); // prod-1 was active

    const toggled = c.products().find(p => p.id === 'prod-1');
    expect(toggled?.is_active).toBe(false);
  });

  it('toggleActive() clears togglingId when done', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();
    await c.toggleActive(MOCK_PRODUCTS[0]);
    expect(c.togglingId()).toBeNull();
  });

  // ── Combo item mutations ───────────────────────────────────────────────────

  it('addComboItem() appends a draft item', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.addComboItem();
    expect(c.fComboItems().length).toBe(1);
    expect(c.fComboItems()[0].quantity).toBe(1);
    expect(c.fComboItems()[0].product_id).toBe('');
  });

  it('removeComboItem() removes by localId', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.addComboItem();
    c.addComboItem();
    const firstId = c.fComboItems()[0].localId;
    c.removeComboItem(firstId);
    expect(c.fComboItems().length).toBe(1);
    expect(c.fComboItems()[0].localId).not.toBe(firstId);
  });

  it('updateComboItemProduct() sets product_id on the right item', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.addComboItem();
    c.addComboItem();
    const secondId = c.fComboItems()[1].localId;
    c.updateComboItemProduct(secondId, 'prod-1');
    expect(c.fComboItems()[1].product_id).toBe('prod-1');
    expect(c.fComboItems()[0].product_id).toBe('');
  });

  it('updateComboItemQty() sets quantity on the right item', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.addComboItem();
    const id = c.fComboItems()[0].localId;
    c.updateComboItemQty(id, 3);
    expect(c.fComboItems()[0].quantity).toBe(3);
  });

  it('toggleIsCombo() clears combo items when turning off', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fIsCombo.set(true);
    c.addComboItem();
    c.addComboItem();
    c.toggleIsCombo(); // turns off
    expect(c.fIsCombo()).toBe(false);
    expect(c.fComboItems()).toHaveLength(0);
  });

  it('toggleIsCombo() does not clear items when turning on', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    c.fIsCombo.set(false);
    c.toggleIsCombo(); // turns on
    expect(c.fIsCombo()).toBe(true);
    expect(c.fComboItems()).toHaveLength(0); // was already empty
  });

  // ── Image upload ──────────────────────────────────────────────────────────

  it('onImageSelected() sets fImageUrl on success', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    const file = new File(['data'], 'burger.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await c.onImageSelected(event);

    expect(c.fImageUrl()).toBe(UPLOAD_URL);
    expect(c.uploadImageError()).toBeNull();
  });

  it('onImageSelected() sets uploadImageError on failure', async () => {
    const storageStub = TestBed.inject(
      StorageService,
    ) as unknown as StorageServiceStub;
    storageStub.uploadProductImage = vi
      .fn()
      .mockRejectedValue(new Error('Tipo de archivo no permitido.'));

    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await c.onImageSelected(event);

    expect(c.uploadImageError()).toContain('no permitido');
    expect(c.fImageUrl()).toBeNull();
  });

  it('onImageSelected() sets uploadingImage to false after completion', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await c.onImageSelected(event);

    expect(c.uploadingImage()).toBe(false);
  });

  it('onImageSelected() does nothing when no file', async () => {
    const storageStub = TestBed.inject(
      StorageService,
    ) as unknown as StorageServiceStub;
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    const event = { target: { files: [], value: '' } } as unknown as Event;

    await c.onImageSelected(event);

    expect(storageStub.uploadProductImage).not.toHaveBeenCalled();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  it('categoryName() returns name for known category id', async () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    await c.ngOnInit();
    expect(c.categoryName('hamburguesas')).toBe('Hamburguesas');
  });

  it('categoryName() returns the id itself when category not found', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    expect(c.categoryName('unknown-cat')).toBe('unknown-cat');
  });

  it('formatCurrency() formats a peso amount', () => {
    const c = TestBed.createComponent(AdminProductsComponent).componentInstance;
    expect(c.formatCurrency(1500).startsWith('$')).toBe(true);
    expect(c.formatCurrency(1500)).toContain('1');
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('goBack() navigates to /staff/admin', () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/admin']);
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(AdminProductsComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });
});
