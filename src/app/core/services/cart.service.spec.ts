import { describe, it, expect, beforeEach } from 'vitest';
import { CartService } from './cart.service';
import { Product } from '../mock-data';

const mockProduct1: Product = {
  id: '1',
  name: 'Hamburguesa Clásica',
  description: 'Pan, carne, lechuga, tomate',
  price: 1200,
  isActive: true,
  categoryId: 'hamburguesas',
};

const mockProduct2: Product = {
  id: '2',
  name: 'Hamburguesa Doble',
  description: 'Pan, 2 carnes, lechuga',
  price: 1800,
  isActive: true,
  categoryId: 'hamburguesas',
};

describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    cartService = new CartService();
  });

  describe('initial state', () => {
    it('should start with empty cart', () => {
      expect(cartService.items()).toEqual([]);
    });

    it('should have zero item count initially', () => {
      expect(cartService.itemCount()).toBe(0);
    });

    it('should have zero total initially', () => {
      expect(cartService.total()).toBe(0);
    });

    it('should report isEmpty as true initially', () => {
      expect(cartService.isEmpty()).toBe(true);
    });
  });

  describe('addItem', () => {
    it('should add a product to empty cart', () => {
      cartService.addItem(mockProduct1, 1);

      expect(cartService.items()).toHaveLength(1);
      expect(cartService.items()[0].product).toEqual(mockProduct1);
      expect(cartService.items()[0].quantity).toBe(1);
    });

    it('should increment quantity when same product is added again', () => {
      cartService.addItem(mockProduct1, 1);
      cartService.addItem(mockProduct1, 1);

      expect(cartService.items()).toHaveLength(1);
      expect(cartService.items()[0].quantity).toBe(2);
    });

    it('should add different products as separate items', () => {
      cartService.addItem(mockProduct1, 1);
      cartService.addItem(mockProduct2, 1);

      expect(cartService.items()).toHaveLength(2);
    });

    it('should add with custom quantity', () => {
      cartService.addItem(mockProduct1, 3);

      expect(cartService.items()[0].quantity).toBe(3);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      cartService.addItem(mockProduct1, 1);
      cartService.addItem(mockProduct2, 1);

      cartService.removeItem('1');

      expect(cartService.items()).toHaveLength(1);
      expect(cartService.items()[0].product.id).toBe('2');
    });

    it('should do nothing when removing non-existent product', () => {
      cartService.addItem(mockProduct1, 1);

      cartService.removeItem('non-existent-id');

      expect(cartService.items()).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity of existing item', () => {
      cartService.addItem(mockProduct1, 1);

      cartService.updateQuantity('1', 5);

      expect(cartService.items()[0].quantity).toBe(5);
    });

    it('should do nothing when updating non-existent product', () => {
      cartService.updateQuantity('non-existent-id', 10);

      expect(cartService.isEmpty()).toBe(true);
    });
  });

  describe('clearCart', () => {
    it('should empty the cart', () => {
      cartService.addItem(mockProduct1, 1);
      cartService.addItem(mockProduct2, 2);

      cartService.clearCart();

      expect(cartService.isEmpty()).toBe(true);
    });
  });

  describe('computed: itemCount', () => {
    it('should sum quantities across all items', () => {
      cartService.addItem(mockProduct1, 2);
      cartService.addItem(mockProduct2, 3);

      expect(cartService.itemCount()).toBe(5);
    });

    it('should update when quantity changes', () => {
      cartService.addItem(mockProduct1, 2);

      cartService.updateQuantity('1', 7);

      expect(cartService.itemCount()).toBe(7);
    });

    it('should be 0 after clearing', () => {
      cartService.addItem(mockProduct1, 5);

      cartService.clearCart();

      expect(cartService.itemCount()).toBe(0);
    });
  });

  describe('computed: total', () => {
    it('should sum price × quantity for all items', () => {
      cartService.addItem(mockProduct1, 2); // 2 × 1200 = 2400
      cartService.addItem(mockProduct2, 1); // 1 × 1800 = 1800

      expect(cartService.total()).toBe(4200); // 2400 + 1800
    });

    it('should update when quantity changes', () => {
      cartService.addItem(mockProduct1, 1); // 1 × 1200 = 1200

      cartService.updateQuantity('1', 3); // 3 × 1200 = 3600

      expect(cartService.total()).toBe(3600);
    });

    it('should be 0 after clearing', () => {
      cartService.addItem(mockProduct1, 10);

      cartService.clearCart();

      expect(cartService.total()).toBe(0);
    });
  });

  describe('computed: isEmpty', () => {
    it('should be false when cart has items', () => {
      cartService.addItem(mockProduct1, 1);

      expect(cartService.isEmpty()).toBe(false);
    });

    it('should be true after clearing', () => {
      cartService.addItem(mockProduct1, 1);
      cartService.clearCart();

      expect(cartService.isEmpty()).toBe(true);
    });
  });
});
