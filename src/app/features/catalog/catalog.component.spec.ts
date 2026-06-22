import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Catalog } from './catalog.component';
import { ProductService } from '../../core/services/product.service';
import type { Category, Product } from '../../core/mock-data';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'uuid-ham-1',
    name: 'Hamburguesa Clásica',
    description: 'Pan, carne, lechuga, tomate',
    price: 1200,
    isActive: true,
    categoryId: 'hamburguesas',
  },
  {
    id: 'uuid-combo-1',
    name: 'Combo Familiar',
    description: 'Hamburguesa + papas + bebida',
    price: 2800,
    isActive: true,
    categoryId: 'combos',
    isCombo: true,
  },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'hamburguesas', name: 'Hamburguesas' },
  { id: 'combos', name: 'Combos' },
];

class ProductServiceStub {
  loadCatalogProducts = (): Promise<Product[]> => Promise.resolve(MOCK_PRODUCTS);
  loadCatalogCategories = (): Promise<Category[]> => Promise.resolve(MOCK_CATEGORIES);
  getProductById = (_id: string): null => null;
  getActiveProducts = (): Product[] => MOCK_PRODUCTS;
}

describe('Catalog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Catalog],
      providers: [
        provideRouter([]),
        { provide: ProductService, useClass: ProductServiceStub },
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Catalog);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show all active products after loading', async () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.filteredProducts().length).toBe(2);
  });

  it('should filter products by category', async () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    component.selectedCategory.set('hamburguesas');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].categoryId).toBe('hamburguesas');

    component.selectedCategory.set('no-existente');
    expect(component.filteredProducts().length).toBe(0);
  });

  it('should restore all products when category is cleared', async () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    component.selectedCategory.set('hamburguesas');
    component.selectedCategory.set('');
    expect(component.filteredProducts().length).toBe(2);
  });

  it('should only include active products returned by the service', async () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.filteredProducts().every(p => p.isActive)).toBe(true);
  });

  it('should set error state and clear loading when service throws', async () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;

    const stub = TestBed.inject(ProductService) as unknown as ProductServiceStub;
    stub.loadCatalogProducts = () => Promise.reject(new Error('Network error'));

    await component.ngOnInit();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });
});
