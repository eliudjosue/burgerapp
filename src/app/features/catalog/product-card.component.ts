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
    <div class="rounded-md overflow-hidden border border-border bg-surface shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <a [routerLink]="['/product', product().id]" class="block aspect-[16/10] relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset">
        @if (product().imageUrl) {
          <img
            #imgEl
            [src]="product().imageUrl"
            [alt]="product().name"
            class="w-full h-full object-cover"
            (error)="imgEl.style.display='none'; imgFallback.style.display=''"
          >
          <div #imgFallback class="absolute inset-0" style="display:none">
            <app-product-image-placeholder class="absolute inset-0" />
            <span class="absolute inset-x-0 bottom-0 px-3 pb-2 text-center"
                  style="background: linear-gradient(to top, color-mix(in oklch, var(--color-bg) 80%, transparent), transparent)">
              <span class="text-xs font-semibold text-fg/80 break-words line-clamp-2">{{ product().name }}</span>
            </span>
          </div>
        } @else {
          <app-product-image-placeholder class="absolute inset-0" />
          <span class="absolute inset-x-0 bottom-0 px-3 pb-2 text-center"
                style="background: linear-gradient(to top, color-mix(in oklch, var(--color-bg) 80%, transparent), transparent)">
            <span class="text-xs font-semibold text-fg/80 break-words line-clamp-2">{{ product().name }}</span>
          </span>
        }
        @if (product().isCombo) {
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style="background-color: var(--color-accent-secondary)">
            Combo
          </span>
        }
      </a>
      <div class="p-4 flex flex-col flex-1">
        <h3 class="h3 mb-1 break-words">
          <a [routerLink]="['/product', product().id]" class="text-inherit hover:text-accent rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
            {{ product().name }}
          </a>
        </h3>
        <p class="small text-muted mb-2 break-words line-clamp-2">{{ product().description }}</p>
        <div class="flex justify-between items-center mt-auto">
          <span class="text-lg font-semibold text-accent">$ {{ product().price }}</span>
          <button
            (click)="addToCart()"
            class="px-4 py-2 bg-accent text-accent-on rounded-md text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
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
