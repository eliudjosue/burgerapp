import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartComponent } from './cart.component';
import { CartService } from '../../core/services/cart.service';
import { RouterLink } from '@angular/router';

const mockProduct1 = {
  id: '1',
  name: 'Hamburguesa Clásica',
  description: 'Pan, carne, lechuga, tomate',
  price: 1200,
  isActive: true,
  categoryId: 'hamburguesas',
};

const mockProduct2 = {
  id: '2',
  name: 'Papas al Ajo',
  description: 'Papas con ajo',
  price: 900,
  isActive: true,
  categoryId: 'acompañamientos',
};

describe('CartComponent', () => {
  let cartService: CartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent, RouterLink],
      providers: [provideRouter([])],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
  });

  afterEach(() => {
    cartService.clearCart();
  });

  describe('empty state', () => {
    it('should show empty cart message when no items', async () => {
      cartService.clearCart();
      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="empty-state"]')).toBeTruthy();
    });

    it('should show "Tu carrito está vacío" message', async () => {
      cartService.clearCart();
      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Tu carrito está vacío');
    });

    it('should NOT show items list when cart is empty', async () => {
      cartService.clearCart();
      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="cart-items"]')).toBeFalsy();
    });
  });

  describe('items display', () => {
    it('should show items when cart has products', async () => {
      cartService.clearCart();
      cartService.addItem(mockProduct1, 2);
      cartService.addItem(mockProduct2, 1);

      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="cart-items"]')).toBeTruthy();
      expect(compiled.textContent).toContain('Hamburguesa Clásica');
      expect(compiled.textContent).toContain('Papas al Ajo');
    });

    it('should show correct subtotal per item', async () => {
      cartService.clearCart();
      cartService.addItem(mockProduct1, 3); // 3 × 1200 = 3600

      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('$3,600');
    });

    it('should show correct total for all items', async () => {
      cartService.clearCart();
      cartService.addItem(mockProduct1, 2); // 2 × 1200 = 2400
      cartService.addItem(mockProduct2, 2); // 2 × 900 = 1800

      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('$4,200');
    });

    it('should show quantity for each item', async () => {
      cartService.clearCart();
      cartService.addItem(mockProduct1, 3);

      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('3');
    });
  });

  describe('actions', () => {
    it('should have a "Continuar Comprando" link to catalog', async () => {
      cartService.clearCart();
      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('a[href="/catalog"]');
      expect(link).toBeTruthy();
    });

    it('should have a "Ir al Checkout" link when cart has items', async () => {
      cartService.clearCart();
      cartService.addItem(mockProduct1, 1);

      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('a[data-testid="checkout-btn"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('/checkout');
    });

    it('should have a remove button for each item', async () => {
      cartService.clearCart();
      cartService.addItem(mockProduct1, 1);

      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="remove-btn"]')).toBeTruthy();
    });

    it('should have +/- quantity buttons for each item', async () => {
      cartService.clearCart();
      cartService.addItem(mockProduct1, 2);

      const fixture = TestBed.createComponent(CartComponent);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const incrementBtns = compiled.querySelectorAll('[data-testid="increment-btn"]');
      const decrementBtns = compiled.querySelectorAll('[data-testid="decrement-btn"]');
      expect(incrementBtns.length).toBeGreaterThan(0);
      expect(decrementBtns.length).toBeGreaterThan(0);
    });
  });
});
