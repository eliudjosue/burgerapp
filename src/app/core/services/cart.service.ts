import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../mock-data';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();

  readonly itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly isEmpty = computed(() => this._items().length === 0);

  readonly total = computed(() =>
    this._items().reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
  );

  addItem(product: Product, quantity = 1): void {
    const existing = this._items().find((i) => i.product.id === product.id);
    if (existing) {
      this._items.update((items) =>
        items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      );
    } else {
      this._items.update((items) => [...items, { product, quantity }]);
    }
  }

  removeItem(productId: string): void {
    this._items.update((items) => items.filter((i) => i.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this._items.update((items) =>
      items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }

  clearCart(): void {
    this._items.set([]);
  }
}
