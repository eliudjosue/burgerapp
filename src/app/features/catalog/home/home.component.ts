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
      <main class="container mx-auto px-4 py-8">
        <!-- Banner Principal -->
        <section class="text-center mb-16">
          <div class="rounded-xl w-full h-64 md:h-80 mb-6 overflow-hidden relative">
            @if (settings()?.bannerImageUrl) {
              <img
                [src]="settings()!.bannerImageUrl"
                alt="Banner"
                class="w-full h-full object-cover"
              >
            } @else {
              <app-product-image-placeholder class="absolute inset-0" />
            }
          </div>
          <h1 class="h1 text-fg mb-4">{{ settings()?.bannerTitle }}</h1>
          <p class="body text-muted max-w-2xl mx-auto mb-6">
            {{ settings()?.bannerSubtitle }}
          </p>
          @if (settings()?.bannerButtonText) {
            <a
              [routerLink]="settings()!.bannerButtonLink"
              class="bg-accent text-accent-on px-6 py-3 rounded-md text-lg font-medium hover:bg-accent/90 transition-colors inline-block"
            >
              {{ settings()!.bannerButtonText }}
            </a>
          }
        </section>

        <!-- Horarios de Atención -->
        <section class="mb-16">
          <div class="bg-surface rounded-lg p-6 border border-border text-center">
            <h2 class="h2 text-fg mb-2">Horarios de Atención</h2>
            <p class="body text-muted">{{ settings()?.businessHours }}</p>
          </div>
        </section>

        <!-- Sección de WhatsApp -->
        @if (settings()?.whatsappNumber) {
          <section class="mb-16">
            <div class="text-center">
              <a
                [href]="'https://wa.me/' + settings()!.whatsappNumber"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-success text-accent-on px-6 py-4 rounded-md text-lg font-medium hover:bg-success/90 transition-colors inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12l2-2m0 0l7-7m-7 7l-2-2m2 2l-2 2m2-2v8m6-8v8m-6-8a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2z" />
                </svg>
                Contactanos por WhatsApp
              </a>
            </div>
          </section>
        }

        <!-- Categorías -->
        <section class="mb-16">
          <h2 class="h2 text-fg mb-6 text-center">Nuestras Categorías</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @for (category of categories(); track category.id) {
              <div class="bg-surface rounded-md p-4 border border-border text-center hover:shadow-md transition-shadow">
                <div class="rounded-lg w-full h-24 mb-2 overflow-hidden relative">
                  @if (category.imageUrl) {
                    <img
                      [src]="category.imageUrl"
                      [alt]="category.name"
                      class="w-full h-full object-cover"
                    >
                  } @else {
                    <app-product-image-placeholder class="absolute inset-0" />
                  }
                </div>
                <h3 class="h3 text-fg">{{ category.name }}</h3>
              </div>
            }
          </div>
        </section>

        <!-- Productos Destacados -->
        <section class="mb-16">
          <h2 class="h2 text-fg mb-6 text-center">Productos Destacados</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (product of featuredProducts(); track product.id) {
              <div class="bg-surface rounded-md overflow-hidden border border-border shadow-sm">
                <div class="w-full h-48 relative">
                  @if (product.imageUrl) {
                    <img
                      [src]="product.imageUrl"
                      [alt]="product.name"
                      class="w-full h-full object-cover"
                    >
                  } @else {
                    <app-product-image-placeholder class="absolute inset-0" />
                  }
                </div>
                <div class="p-4">
                  <h3 class="h3 text-fg mb-2">{{ product.name }}</h3>
                  <p class="small text-muted mb-3">{{ product.description }}</p>
                  <div class="flex justify-between items-center">
                    <span class="body font-bold text-accent">{{ product.price }}</span>
                    <a
                      [routerLink]="['/product', product.id]"
                      class="bg-accent text-accent-on px-4 py-2 rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      Ver producto
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        <!-- CTA Final -->
        <section class="text-center bg-surface rounded-lg p-8 border border-border">
          <h2 class="h2 text-fg mb-4">¿Listo para pedir?</h2>
          <p class="body text-muted mb-6 max-w-2xl mx-auto">
            Hacé tu pedido online y recibilo en tu puerta.
          </p>
          <a
            routerLink="/catalog"
            class="bg-accent text-accent-on px-6 py-3 rounded-md text-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Ver Catálogo
          </a>
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
