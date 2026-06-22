import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ProductCard } from './product-card.component';
import { ProductService } from '../../core/services/product.service';
import type { Category, Product } from '../../core/mock-data';

@Component({
  selector: 'app-catalog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCard],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="h1 mb-8 text-center">Nuestro Menú</h1>

      <!-- Category Filter -->
      <div class="mb-8">
        <label for="categoryFilter" class="block text-sm font-medium text-muted mb-2">
          Filtrar por categoría
        </label>
        <select
          id="categoryFilter"
          (change)="onCategoryChange($event)"
          class="w-full p-3 border border-border rounded-md bg-surface text-body focus:ring-2 focus:ring-accent-soft focus:border-accent"
        >
          <option value="">Todas las categorías</option>
          @for (category of categories(); track category.id) {
            <option [value]="category.id">{{ category.name }}</option>
          }
        </select>
      </div>

      @if (isLoading()) {
        <div class="text-center py-12">
          <p class="text-muted">Cargando productos…</p>
        </div>
      } @else if (hasError()) {
        <div class="text-center py-12">
          <p class="text-danger">
            No se pudieron cargar los productos. Intentá de nuevo más tarde.
          </p>
        </div>
      } @else if (filteredProducts().length === 0) {
        <div class="text-center py-12">
          <p class="text-muted">No hay productos disponibles en esta categoría.</p>
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
  `,
})
export class Catalog implements OnInit {
  private readonly productService = inject(ProductService);

  readonly selectedCategory = signal<string>('');
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  private readonly _products = signal<Product[]>([]);
  private readonly _categories = signal<Category[]>([]);

  readonly categories = this._categories.asReadonly();

  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const all = this._products();
    return category ? all.filter(p => p.categoryId === category) : all;
  });

  async ngOnInit(): Promise<void> {
    try {
      const [products, categories] = await Promise.all([
        this.productService.loadCatalogProducts(),
        this.productService.loadCatalogCategories(),
      ]);
      this._products.set(products);
      this._categories.set(categories);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set(target.value);
  }
}
