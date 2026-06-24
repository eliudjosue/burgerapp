import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../../core/services/product.service';
import type { Product, ComboItem } from '../../../core/mock-data';

const MOCK_PRODUCT: Product = {
  id: 'uuid-ham-1',
  name: 'Hamburguesa Clásica',
  description: 'Pan, carne, lechuga, tomate',
  price: 1200,
  isActive: true,
  categoryId: 'hamburguesas',
  imageUrl: 'https://placehold.co/600x400?text=Hamburguesa',
};

const MOCK_COMBO: Product = {
  id: 'uuid-combo-1',
  name: 'Combo Familiar',
  description: 'Hamburguesa + papas + bebida',
  price: 2800,
  isActive: true,
  categoryId: 'combos',
  isCombo: true,
};

const MOCK_COMBO_ITEMS: ComboItem[] = [
  { productId: 'uuid-ham-1', quantity: 1, name: 'Hamburguesa Clásica' },
  { productId: 'uuid-papas-1', quantity: 1, name: 'Papas al Ajo' },
];

class ProductServiceStub {
  getProductById = (_id: string): Promise<Product | null> => Promise.resolve(null);
  getComboItemsWithNames = (_id: string): Promise<ComboItem[]> => Promise.resolve([]);
}

describe('ProductDetailComponent', () => {
  let stub: ProductServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ProductService, useClass: ProductServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (p: string) => (p === 'id' ? 'uuid-ham-1' : null) } },
          },
        },
      ],
    }).compileComponents();

    stub = TestBed.inject(ProductService) as unknown as ProductServiceStub;
  });

  it('should create', async () => {
    stub.getProductById = () => Promise.resolve(MOCK_PRODUCT);
    const fixture = TestBed.createComponent(ProductDetailComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set product signal when service returns an active product', async () => {
    stub.getProductById = () => Promise.resolve(MOCK_PRODUCT);
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.product()).toEqual(MOCK_PRODUCT);
    expect(component.loading()).toBe(false);
  });

  it('should leave product null when service returns null (inactive or missing)', async () => {
    // default stub returns null — covers both inactive and non-existent products
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.product()).toBeNull();
    expect(component.loading()).toBe(false);
  });

  it('should fetch combo items and attach them to the product', async () => {
    stub.getProductById = () => Promise.resolve(MOCK_COMBO);
    stub.getComboItemsWithNames = () => Promise.resolve(MOCK_COMBO_ITEMS);
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    const product = component.product();
    expect(product?.comboItems?.length).toBe(2);
    expect(product?.comboItems?.[0].name).toBe('Hamburguesa Clásica');
    expect(product?.comboItems?.[1].name).toBe('Papas al Ajo');
  });
});
