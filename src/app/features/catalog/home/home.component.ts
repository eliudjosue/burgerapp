import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { SiteSettingsService, SiteSettingsData } from '../../../core/services/site-settings.service';
import type { Product, Category } from '../../../core/mock-data';
import { ProductImagePlaceholderComponent } from '../../../shared/components/product-image-placeholder/product-image-placeholder.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductImagePlaceholderComponent],
  template: `
    @if (isLoading()) {
      <div class="container mx-auto px-4 py-16 text-center">
        <p class="text-muted">Cargando…</p>
      </div>
    } @else if (hasError()) {
      <div class="container mx-auto px-4 py-16 text-center">
        <p class="text-danger">
          No se pudo cargar el contenido. Intentá de nuevo más tarde.
        </p>
      </div>
    } @else {
      <main class="container mx-auto px-4 py-6 space-y-8">

        <!-- ── ZONA 1: HERO BENTO ────────────────────────────────────────── -->
        <section>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">

            <!-- Hero: col-span-2 en mobile (fila completa), 2×2 en desktop -->
            <div
              class="col-span-2 md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden bg-cover bg-center flex items-end"
              style="min-height: clamp(200px, 32vw, 360px)"
              [style.background-image]="settings()?.bannerImageUrl ? 'url(' + settings()!.bannerImageUrl + ')' : 'none'"
            >
              @if (!settings()?.bannerImageUrl) {
                <app-product-image-placeholder class="absolute inset-0" />
              }
              @if (settings()?.bannerButtonText) {
                <div class="relative z-10 w-full px-4 pb-4">
                  <a
                    [routerLink]="settings()!.bannerButtonLink"
                    class="bg-accent text-accent-on px-5 py-2 rounded-md text-sm font-semibold hover:bg-accent/90 transition-colors inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {{ settings()!.bannerButtonText }}
                  </a>
                </div>
              }
            </div>

            <!-- Horarios: 1×1 en mobile y desktop -->
            <div class="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 min-h-[120px]">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                    style="background-color: color-mix(in oklch, var(--color-accent) 12%, transparent)" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h2 class="font-display font-semibold text-fg text-sm md:text-base leading-tight">Horarios</h2>
                <p class="text-xs text-muted mt-0.5 break-words line-clamp-2">{{ settings()?.businessHours }}</p>
              </div>
            </div>

            <!-- WhatsApp: 1×1 en mobile y desktop -->
            @if (settings()?.whatsappNumber) {
              <a
                [href]="'https://wa.me/' + settings()!.whatsappNumber"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactanos por WhatsApp"
                class="bg-success rounded-xl p-4 flex flex-col gap-2 text-accent-on hover:bg-success/90 transition-colors min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
              >
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/15 shrink-0" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
                <div>
                  <p class="font-display font-semibold text-sm md:text-base leading-tight">WhatsApp</p>
                  <p class="text-xs text-accent-on/80 mt-0.5">Contactanos</p>
                </div>
              </a>
            } @else {
              <div class="rounded-xl min-h-[120px]" style="background-color: color-mix(in oklch, var(--color-border) 30%, transparent)"></div>
            }

          </div>
        </section>

        <!-- ── ZONA 2: CATEGORÍAS ────────────────────────────────────────── -->
        <section>
          <h2 class="text-xl md:text-2xl font-semibold font-display text-fg mb-4 text-center">Nuestras Categorías</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            @for (category of categories(); track category.id) {
              <div class="relative rounded-2xl overflow-hidden aspect-[5/4] group">
                @if (category.imageUrl) {
                  <img
                    [src]="category.imageUrl"
                    [alt]="category.name"
                    class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  >
                } @else {
                  <app-product-image-placeholder class="absolute inset-0" />
                }
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true"></div>
                <div class="absolute bottom-3 left-3 right-3">
                  <h3 class="text-sm md:text-base font-semibold text-white drop-shadow-sm break-words line-clamp-1">{{ category.name }}</h3>
                  @if (category.description) {
                    <p class="text-xs text-white/80 drop-shadow-sm break-words line-clamp-1 mt-0.5">{{ category.description }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- ── ZONA 3: DESTACADOS (slider) ─────────────────────────────── -->
        <section>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-xl md:text-2xl font-semibold font-display text-fg">Productos Destacados</h2>
            <span class="text-sm text-muted shrink-0">Deslizá →</span>
          </div>
          <div
            class="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
            style="scrollbar-width: thin; scrollbar-color: var(--color-border) transparent"
          >
            @for (product of featuredProducts(); track product.id) {
              <a
                [routerLink]="['/product', product.id]"
                [attr.aria-label]="'Ver producto: ' + product.name"
                class="relative flex-shrink-0 w-[72vw] sm:w-64 md:w-52 lg:w-56 aspect-[3/4] rounded-2xl overflow-hidden snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 group"
                style="background: #1C1712"
              >
                <!-- Imagen a sangre -->
                @if (product.imageUrl) {
                  <img
                    [src]="product.imageUrl"
                    [alt]="product.name"
                    class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  >
                } @else {
                  <app-product-image-placeholder class="absolute inset-0" />
                }

                <!-- Overlay de legibilidad -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true"></div>

                <!-- Badge arriba a la derecha -->
                @if (product.isCombo) {
                  <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style="background-color: var(--color-accent-secondary)">Combo</span>
                }

                <!-- Contenido abajo -->
                <div class="absolute bottom-0 left-0 right-0 p-4">
                  <h3 class="text-base font-bold text-white line-clamp-1 mb-1">{{ product.name }}</h3>
                  <p class="text-xs line-clamp-2 mb-3" style="color: color-mix(in oklch, white 65%, transparent)">{{ product.description }}</p>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-lg font-bold text-white">$ {{ product.price }}</span>
                    <span class="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-accent shrink-0">Ver</span>
                  </div>
                </div>
              </a>
            }
            <!-- espaciador: da margen derecho a la última card -->
            <div class="shrink-0 w-4" aria-hidden="true"></div>
          </div>
        </section>

        <!-- ── ZONA 4: CTA FINAL ─────────────────────────────────────────── -->
        <section class="rounded-xl overflow-hidden" style="background-color: var(--color-accent)">
          <div class="px-6 py-8 md:py-10 text-center">
            <h2 class="text-xl md:text-2xl font-semibold font-display text-white mb-2">¿Listo para pedir?</h2>
            <p class="text-sm mb-6 max-w-xl mx-auto break-words" style="color: color-mix(in oklch, white 75%, transparent)">
              Hacé tu pedido online y recibilo en tu puerta.
            </p>
            <a
              routerLink="/catalog"
              class="bg-accent-on text-fg px-6 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-on focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
            >
              Ver Catálogo
            </a>
          </div>
        </section>

      </main>
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly siteSettingsService = inject(SiteSettingsService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly settings = signal<SiteSettingsData | null>(null);
  readonly featuredProducts = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const [settings, products, categories] = await Promise.all([
        this.siteSettingsService.getSettings(),
        this.productService.loadFeaturedProducts(),
        this.productService.loadCatalogCategories(),
      ]);
      this.settings.set(settings);
      this.featuredProducts.set(products);
      this.categories.set(categories);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
