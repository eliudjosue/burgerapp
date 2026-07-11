import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Location, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { SeoService } from '../../../core/services/seo.service';
import { Product } from '../../../core/mock-data';
import { ProductImagePlaceholderComponent } from '../../../shared/components/product-image-placeholder/product-image-placeholder.component';

@Component({
  selector: 'app-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, ProductImagePlaceholderComponent],
  template: `
    <div class="bg-bg flex flex-col min-h-dvh">

      <!-- Scrollable content -->
      <div class="flex-1">

      <!-- Back nav -->
      <div class="container mx-auto px-4 pt-4 pb-3">
        <button
          type="button"
          (click)="goBack()"
          class="w-10 h-10 rounded-full bg-surface border border-border shadow-sm hover:shadow-md flex items-center justify-center text-fg hover:text-accent active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label="Volver a la página anterior"
        >
          <svg class="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      @if (loading()) {
        <div class="container mx-auto px-4 py-16 text-center">
          <p class="text-muted">Cargando producto…</p>
        </div>
      } @else if (product(); as prod) {

        <div class="container mx-auto px-4 pb-6 max-w-2xl">

          <!-- Product image -->
          <div class="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface border border-border mb-5">
            @if (prod.imageUrl) {
              <img
                #imgEl
                [src]="prod.imageUrl"
                [alt]="prod.name"
                class="w-full h-full object-cover"
                (error)="imgEl.style.display='none'; imgFallback.style.display=''"
              >
              <div #imgFallback class="absolute inset-0" style="display:none">
                <app-product-image-placeholder class="absolute inset-0" />
              </div>
            } @else {
              <app-product-image-placeholder class="absolute inset-0" />
            }
            @if (prod.isCombo) {
              <span
                class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style="background-color: var(--color-accent-secondary)"
              >
                Combo
              </span>
            }
          </div>

          <!-- Name + Price -->
          <h1 class="text-2xl md:text-3xl font-bold text-fg mb-1 leading-tight">{{ prod.name }}</h1>
          <p class="text-2xl font-bold text-accent mb-5">
            {{ prod.price | currency:'ARS':'symbol-narrow':'1.0-0' }}
          </p>

          <!-- Quantity selector -->
          <div class="flex items-center gap-4 mb-5">
            <span class="text-sm font-medium text-muted" id="qty-label">Cantidad</span>
            <div
              class="inline-flex items-center rounded-xl border border-border bg-surface overflow-hidden"
              role="group"
              aria-labelledby="qty-label"
            >
              <button
                type="button"
                (click)="decreaseQuantity()"
                class="w-11 h-11 flex items-center justify-center text-fg hover:bg-fg-soft active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                aria-label="Disminuir cantidad"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clip-rule="evenodd" />
                </svg>
              </button>
              <span
                class="w-10 text-center text-base font-semibold text-fg select-none tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {{ selectedQuantity() }}
              </span>
              <button
                type="button"
                (click)="increaseQuantity()"
                class="w-11 h-11 flex items-center justify-center bg-accent text-accent-on hover:bg-accent/90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                aria-label="Aumentar cantidad"
              >
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Brand chips -->
          <div class="flex flex-wrap gap-2 mb-6" role="list" aria-label="Características del producto">
            <span role="listitem" class="px-3 py-1.5 rounded-full text-sm font-medium bg-accent-soft text-accent border border-accent/20">
              Artesanal
            </span>
            <span role="listitem" class="px-3 py-1.5 rounded-full text-sm font-medium bg-fg-soft text-muted">
              Envío a domicilio
            </span>
          </div>

          <!-- Description -->
          <section aria-label="Descripción del producto" class="mb-6">
            <h2 class="text-base font-semibold text-fg mb-2">Descripción</h2>
            <p class="text-sm text-muted leading-relaxed">
              @if (showFullDesc() || prod.description.length <= 120) {
                {{ prod.description }}
              } @else {
                {{ prod.description.slice(0, 120) }}…
              }
            </p>
            @if (prod.description.length > 120) {
              <button
                type="button"
                (click)="showFullDesc.update(v => !v)"
                class="text-sm font-medium text-accent mt-1.5 hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
              >
                {{ showFullDesc() ? 'Ver menos' : 'Ver más' }}
              </button>
            }
          </section>

          <!-- Combo items -->
          @if (prod.isCombo && prod.comboItems) {
            <section aria-label="Contenido del combo" class="mb-6">
              <h2 class="text-base font-semibold text-fg mb-3">Contenido del Combo</h2>
              <ul class="divide-y divide-border">
                @for (item of prod.comboItems; track item.productId) {
                  <li class="flex items-center gap-2 py-2.5">
                    <span class="text-sm font-semibold text-accent">×{{ item.quantity }}</span>
                    <span class="text-sm text-fg">{{ item.name }}</span>
                  </li>
                }
              </ul>
            </section>
          }

        </div>

      } @else {
        <div class="container mx-auto px-4 py-16 text-center">
          <h2 class="text-xl font-semibold text-fg mb-2">Producto no encontrado</h2>
          <p class="text-sm text-muted mb-5">El producto que buscás no existe o no está disponible.</p>
          <a
            routerLink="/catalog"
            class="text-sm font-medium text-accent hover:text-accent/80 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Ir al Catálogo
          </a>
        </div>
      }

      </div><!-- end flex-1 scrollable content -->

      <!-- Sticky action bar (shown only when product is loaded) -->
      @if (product()) {
        <div class="sticky bottom-0 z-40 bg-bg/95 backdrop-blur-sm border-t border-border">
          <div class="container mx-auto px-4 py-3 max-w-2xl flex gap-3">

            <!-- Primary: Add to cart -->
            <button
              type="button"
              (click)="addToCart()"
              [class]="justAdded()
                ? 'flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-success text-accent-on font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2'
                : 'flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-accent-on font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'"
              [attr.aria-label]="justAdded() ? 'Agregado al carrito' : 'Agregar ' + selectedQuantity() + ' al carrito'"
            >
              @if (justAdded()) {
                <svg class="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
                Agregado
              } @else {
                <svg class="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Agregar · {{ selectedQuantity() }}
              }
            </button>

            <!-- Secondary: View cart -->
            <a
              routerLink="/cart"
              class="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-accent text-accent font-semibold text-sm hover:bg-accent-soft active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Ver carrito
            </a>

          </div>
        </div>
      }

    </div>
  `,
  styles: `:host { display: block; }`
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly seoService = inject(SeoService);
  private readonly location = inject(Location);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly selectedQuantity = signal(1);
  readonly justAdded = signal(false);
  readonly showFullDesc = signal(false);
  private justAddedTimer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.seoService.reset();
      return;
    }
    try {
      const product = await this.productService.getProductById(id);
      if (product?.isCombo) {
        const comboItems = await this.productService.getComboItemsWithNames(id);
        this.product.set({ ...product, comboItems });
      } else {
        this.product.set(product);
      }
      const prod = this.product();
      if (prod) {
        this.seoService.update({
          title: prod.name,
          description: prod.description,
          image: prod.imageUrl,
          type: 'article',
        });
      } else {
        this.seoService.reset();
      }
    } catch {
      this.seoService.reset();
    } finally {
      this.loading.set(false);
    }
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
      if (this.justAddedTimer !== null) clearTimeout(this.justAddedTimer);
      this.justAdded.set(true);
      this.justAddedTimer = setTimeout(() => {
        this.justAdded.set(false);
        this.justAddedTimer = null;
      }, 1200);
    }
  }

  goBack(): void {
    this.location.back();
  }

  ngOnDestroy(): void {
    if (this.justAddedTimer !== null) clearTimeout(this.justAddedTimer);
    this.seoService.reset();
  }
}
