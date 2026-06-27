import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductImagePlaceholderComponent } from '../../shared/components/product-image-placeholder/product-image-placeholder.component';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  categoryId: string;
  imageUrl?: string;
  isCombo?: boolean;
  comboItems?: Array<{ productId: string; quantity: number }>;
}

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductImagePlaceholderComponent],
  template: `
    <div class="rounded-md overflow-hidden border border-border bg-surface shadow-sm hover:shadow-md transition-shadow duration-200">
      <a [routerLink]="['/product', product().id]" class="block aspect-[16/10] relative">
        @if (product().imageUrl) {
          <img
            [src]="product().imageUrl"
            [alt]="product().name"
            class="w-full h-full object-cover"
          >
        } @else {
          <app-product-image-placeholder class="absolute inset-0" />
        }
        @if (product().isCombo) {
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style="background-color: var(--color-accent-secondary)">
            Combo
          </span>
        }
      </a>
      <div class="p-4">
        <h3 class="h3 mb-1">
          <a [routerLink]="['/product', product().id]" class="text-inherit hover:text-accent">
            {{ product().name }}
          </a>
        </h3>
        <p class="small text-muted mb-2">{{ product().description }}</p>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold text-accent">$ {{ product().price }}</span>
          <button
            (click)="addToCart()"
            class="px-4 py-2 bg-accent text-accent-on rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class ProductCard {
  product = input.required<Product>();
  private readonly cartService = inject(CartService);

  addToCart(): void {
    this.cartService.addItem(this.product(), 1);
  }
}
