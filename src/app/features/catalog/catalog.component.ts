import { Component, signal } from '@angular/core';
import { ProductCard } from './product-card.component';
import { CommonModule } from '@angular/common';
import { mockAllProducts, mockCategories } from '../../core/mock-data';

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

interface Category {
  id: string;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ProductCard, CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="h1 mb-8 text-center">Nuestro Menú</h1>
      
      <!-- Category Filter -->
      <div class="mb-8">
        <label for="categoryFilter" class="block text-sm font-medium text-muted mb-2">Filtrar por categoría</label>
        <select 
          id="categoryFilter"
          (change)="onCategoryChange($event)"
          class="w-full p-3 border border-border rounded-md bg-surface text-body focus:ring-2 focus:ring-accent-soft focus:border-accent"
        >
          <option value="">Todas las categorías</option>
          @for (category of categories; track category.id) {
            <option [value]="category.id">{{ category.name }}</option>
          }
        </select>
      </div>

      <!-- Products Grid -->
      @if (filteredProducts().length === 0) {
        <div class="text-center py-12">
          <p class="text-muted">No hay productos disponibles en esta categoría</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of filteredProducts(); track product.id) {
            <app-product-card [product]="product" />
          }
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
export class Catalog {
  // Mock data (in a real app this would come from a service)
  products = mockAllProducts;
  categories = mockCategories;

  // Signals for reactive data
  selectedCategory = signal<string>('');
  filteredProducts = signal<Product[]>(this.products.filter(p => p.isActive));

  constructor() {
    // Initialize with all active products
    this.updateFilteredProducts();
  }

  onCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set(target.value);
    this.updateFilteredProducts();
  }

  updateFilteredProducts() {
    const category = this.selectedCategory();
    
    if (!category) {
      // Show all active products
      this.filteredProducts.set(this.products.filter(p => p.isActive));
    } else {
      // Show products from selected category that are active
      this.filteredProducts.set(this.products.filter(p => p.isActive && p.categoryId === category));
    }
  }
}