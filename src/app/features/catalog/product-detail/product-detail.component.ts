import { Component, input, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/mock-data';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center mb-6">
        <a routerLink="/catalog" class="text-accent hover:text-accent/90 font-medium flex items-center">
          ← Volver al Catálogo
        </a>
      </div>

      @if (product(); as product) {
        <div class="bg-surface border border-border rounded-md overflow-hidden">
          <img 
            [src]="product.imageUrl" 
            [alt]="product.name"
            class="w-full aspect-[16/10] object-cover"
          >
          
          <div class="p-6">
            <h1 class="h1 mb-2">{{ product.name }}</h1>
            <p class="body text-muted mb-4">{{ product.description }}</p>
            
            <div class="flex items-center mb-6">
              <span class="text-2xl font-semibold text-accent">
                $ {{ product.price | currency:'ARS':'symbol-narrow':'1.0-0' }}
              </span>
            </div>
            
            @if (product.isCombo && product.comboItems) {
              <div class="mb-6">
                <h2 class="h2 mb-3">Contenido del Combo</h2>
                <ul class="space-y-2">
                  @for (item of product.comboItems; track item) {
                    <li class="flex justify-between items-center py-2 border-b border-border">
                      <div class="flex items-center">
                        <span class="font-medium mr-2">x{{ item.quantity }}</span>
                        <span>{{ getProductNameById(item.productId) }}</span>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }
            
            <div class="flex items-center gap-4 mb-6">
              <div class="flex items-center">
                <button 
                  (click)="decreaseQuantity()"
                  class="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-lg font-medium hover:bg-surface/90 transition-colors"
                  aria-label="Reducir cantidad"
                >
                  -
                </button>
                <span class="mx-4 text-lg font-medium">{{ selectedQuantity() }}</span>
                <button 
                  (click)="increaseQuantity()"
                  class="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-lg font-medium hover:bg-surface/90 transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              
              <button 
                (click)="addToCart()"
                [disabled]="justAdded()"
                class="px-6 py-3 bg-accent text-accent-on rounded-md font-medium hover:bg-accent/90 transition-colors disabled:opacity-70"
                [class]="justAdded() ? 'bg-success text-white' : ''"
              >
                {{ justAdded() ? '¡Agregado!' : 'Agregar al Carrito' }}
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="bg-surface border border-border rounded-md p-8 text-center">
          <h2 class="h2 mb-2">Producto no encontrado</h2>
          <p class="text-muted mb-4">El producto que estás buscando no existe o no está disponible.</p>
          <a routerLink="/catalog" class="text-accent hover:text-accent/90 font-medium">
            Volver al Catálogo
          </a>
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
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  
  // Usamos signal directamente en lugar de input para evitar el problema del set()
  product = signal<Product | null>(null);
  
  selectedQuantity = signal(1);
  justAdded = signal(false);
  
  constructor() {
    // Cargamos el producto por ID cuando el componente se inicializa
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const product = this.productService.getProductById(id);
      if (product) {
        this.product.set(product);
      }
    }
  }
  
  getProductNameById(id: string) {
    const product = this.productService.getProductById(id);
    return product ? product.name : '';
  }
  
  increaseQuantity(): void {
    this.selectedQuantity.update(q => q + 1);
  }
  
  decreaseQuantity(): void {
    if (this.selectedQuantity() > 1) {
      this.selectedQuantity.update(q => q - 1);
    }
  }
  
  addToCart(): void {
    const product = this.product();
    if (product) {
      this.cartService.addItem(product, this.selectedQuantity());
      this.justAdded.set(true);
      setTimeout(() => this.justAdded.set(false), 2000);
    }
  }
}