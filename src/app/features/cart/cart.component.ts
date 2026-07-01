import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { ProductImagePlaceholderComponent } from '../../shared/components/product-image-placeholder/product-image-placeholder.component';

@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, ProductImagePlaceholderComponent],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="h1 mb-8 text-center">Tu Carrito</h1>

      @if (cartService.isEmpty()) {
        <!-- Empty state -->
        <div data-testid="empty-state" class="text-center py-12">
          <div class="w-24 h-24 mx-auto mb-6 bg-border rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 class="h2 text-fg mb-4">Tu carrito está vacío</h2>
          <p class="body text-muted mb-6">¡Agregá algunos productos para comenzar a comprar!</p>
          <a routerLink="/catalog"
            class="bg-accent text-accent-on px-6 py-3 rounded-md text-lg font-medium hover:bg-accent/90 transition-colors inline-block">
            Ver Catálogo
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Items list -->
          <div class="lg:col-span-2">
            <div data-testid="cart-items" class="bg-surface rounded-md border border-border shadow-sm">
              @for (item of cartService.items(); track item.product.id) {
                <div class="p-6 border-b border-border last:border-b-0">
                  <div class="flex items-start gap-4">
                    <!-- Product image -->
                    <div class="w-20 h-20 rounded-md flex-shrink-0 overflow-hidden relative">
                      @if (item.product.imageUrl) {
                        <img [src]="item.product.imageUrl" [alt]="item.product.name"
                          class="w-full h-full object-cover" />
                      } @else {
                        <app-product-image-placeholder class="absolute inset-0" />
                      }
                    </div>

                    <!-- Product info -->
                    <div class="flex-1 min-w-0">
                      <h3 class="h3 text-fg mb-1 break-words">{{ item.product.name }}</h3>
                      <p class="small text-muted mb-3 break-words">{{ item.product.description }}</p>

                      <!-- Quantity + subtotal row -->
                      <div class="flex items-center justify-between">
                        <!-- Quantity controls (compact: 28px buttons per style.md) -->
                        <div class="flex items-center gap-1">
                          <button
                            data-testid="decrement-btn"
                            (click)="decrement(item.product.id, item.quantity)"
                            class="w-7 h-7 flex items-center justify-center rounded-full border border-border text-fg hover:bg-bg transition-colors"
                            [attr.aria-label]="'Reducir cantidad de ' + item.product.name">
                            <span class="text-sm font-medium">−</span>
                          </button>
                          <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                          <button
                            data-testid="increment-btn"
                            (click)="increment(item.product.id)"
                            class="w-7 h-7 flex items-center justify-center rounded-full border border-border text-fg hover:bg-bg transition-colors"
                            [attr.aria-label]="'Aumentar cantidad de ' + item.product.name">
                            <span class="text-sm font-medium">+</span>
                          </button>
                        </div>

                        <!-- Subtotal -->
                        <span class="text-accent font-semibold">
                          {{ item.product.price * item.quantity | currency:'ARS':'symbol-narrow':'1.0-0' }}
                        </span>
                      </div>
                    </div>

                    <!-- Remove button -->
                    <button
                      data-testid="remove-btn"
                      (click)="removeItem(item.product.id)"
                      class="text-muted hover:text-danger transition-colors flex-shrink-0"
                      [attr.aria-label]="'Eliminar ' + item.product.name">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Summary sidebar -->
          <div>
            <div class="bg-surface rounded-md border border-border shadow-sm p-6 sticky top-6">
              <h2 class="h2 text-fg mb-4">Resumen del Pedido</h2>

              <div class="space-y-3 mb-4">
                <div class="flex justify-between">
                  <span class="text-muted">Subtotal</span>
                  <span class="font-medium">
                    {{ cartService.total() | currency:'ARS':'symbol-narrow':'1.0-0' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Costo de envío</span>
                  <span class="font-medium text-small">$0 — se define en checkout</span>
                </div>
                <div class="border-t border-border pt-3 mt-3">
                  <div class="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span class="text-accent">
                      {{ cartService.total() | currency:'ARS':'symbol-narrow':'1.0-0' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <a routerLink="/catalog"
                  class="block w-full text-center px-4 py-3 border border-border rounded-md body font-medium hover:bg-bg transition-colors">
                  Continuar Comprando
                </a>
                <a routerLink="/checkout"
                  data-testid="checkout-btn"
                  class="block w-full text-center px-4 py-3 bg-accent text-accent-on rounded-md body font-medium hover:bg-accent/90 transition-colors">
                  Ir al Checkout
                </a>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class CartComponent {
  protected readonly cartService = inject(CartService);

  removeItem(productId: string): void {
    this.cartService.removeItem(productId);
  }

  increment(productId: string): void {
    const item = this.cartService.items().find((i) => i.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  decrement(productId: string, currentQty: number): void {
    if (currentQty <= 1) {
      this.cartService.removeItem(productId);
    } else {
      this.cartService.updateQuantity(productId, currentQty - 1);
    }
  }
}
