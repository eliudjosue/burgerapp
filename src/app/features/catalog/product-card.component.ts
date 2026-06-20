import { Component, input } from '@angular/core';

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
  template: `
    <div class="rounded-md overflow-hidden border border-border bg-surface shadow-sm hover:shadow-md transition-shadow duration-200">
      <img 
        [src]="product().imageUrl" 
        [alt]="product().name"
        class="w-full aspect-[16/10] object-cover"
      >
      <div class="p-4">
        <h3 class="h3 mb-1">{{ product().name }}</h3>
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