import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="rounded-md overflow-hidden border border-border bg-surface shadow-sm hover:shadow-md transition-shadow duration-200">
      <a [routerLink]="['/product', product().id]" class="block">
        <img 
          [src]="product().imageUrl" 
          [alt]="product().name"
          class="w-full aspect-[16/10] object-cover"
        >
      </a>
      <div class="p-4">
        <h3 class="h3 mb-1"><a [routerLink]="['/product', product().id]" class="text-inherit hover:text-accent">{{ product().name }}</a></h3>
        <p class="small text-muted mb-2">{{ product().description }}</p>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold text-accent">$ {{ product().price }}</span>
          <button class="px-4 py-2 bg-accent text-accent-on rounded-md text-sm font-medium hover:bg-accent/90 transition-colors">
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
}