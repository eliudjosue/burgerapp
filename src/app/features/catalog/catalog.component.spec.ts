import { TestBed } from '@angular/core/testing';
import { Catalog } from './catalog.component';

describe('Catalog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Catalog],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should filter products by category', () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;
    
    // Initially should show all active products
    expect(component.filteredProducts().length).toBeGreaterThan(0);
    
    // Filter by hamburguesas
    component.selectedCategory.set('hamburguesas');
    component.updateFilteredProducts();
    
    expect(component.filteredProducts().length).toBeGreaterThan(0);
    
    // Filter by non-existent category  
    component.selectedCategory.set('no-existente');
    component.updateFilteredProducts();
    
    expect(component.filteredProducts().length).toBe(0);
  });

  it('should exclude inactive products from display', () => {
    const fixture = TestBed.createComponent(Catalog);
    const component = fixture.componentInstance;
    
    // Initially should show all active products
    expect(component.filteredProducts().some(p => p.id === '4')).toBe(false); // Producto inactivo
  });
});