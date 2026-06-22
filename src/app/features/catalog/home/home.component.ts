import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mockBannerData, mockCategories, mockFeaturedProducts, mockSiteSettings } from '../../../core/mock-data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="container mx-auto px-4 py-8">
      <!-- Banner Principal -->
      <section class="text-center mb-16">
        <div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 md:h-80 mb-6"></div>
        <h1 class="h1 text-fg mb-4">{{ mockBannerData.title }}</h1>
        <p class="body text-muted max-w-2xl mx-auto mb-6">
          {{ mockBannerData.subtitle }}
        </p>
        @if (mockBannerData.buttonText) {
          <a [routerLink]="mockBannerData.buttonLink" class="bg-accent text-accent-on px-6 py-3 rounded-md text-lg font-medium hover:bg-orange-700 transition-colors inline-block">
            {{ mockBannerData.buttonText }}
          </a>
        }
      </section>

      <!-- Horarios de Atención -->
      <section class="mb-16">
        <div class="bg-surface rounded-lg p-6 border border-border text-center">
          <h2 class="h2 text-fg mb-2">Horarios de Atención</h2>
          <p class="body text-muted">{{ mockSiteSettings.businessHours }}</p>
        </div>
      </section>

      <!-- Sección de WhatsApp -->
      <section class="mb-16">
        <div class="text-center">
          <a [href]="'https://wa.me/' + mockSiteSettings.whatsappNumber" target="_blank" class="bg-success text-accent-on px-6 py-4 rounded-md text-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12l2-2m0 0l7-7m-7 7l-2-2m2 2l-2 2m2-2v8m6-8v8m-6-8a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2z" />
            </svg>
            Contactanos por WhatsApp
          </a>
        </div>
      </section>

      <!-- Categorías -->
      <section class="mb-16">
        <h2 class="h2 text-fg mb-6 text-center">Nuestras Categorías</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (category of mockCategories; track category.id) {
            <div class="bg-surface rounded-md p-4 border border-border text-center hover:shadow-md transition-shadow">
              <div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-24 mb-2"></div>
              <h3 class="h3 text-fg">{{ category.name }}</h3>
            </div>
          }
        </div>
      </section>

      <!-- Productos Destacados -->
      <section class="mb-16">
        <h2 class="h2 text-fg mb-6 text-center">Productos Destacados</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (product of mockFeaturedProducts; track product.id) {
            <div class="bg-surface rounded-md overflow-hidden border border-border shadow-sm">
              <div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48"></div>
              <div class="p-4">
                <h3 class="h3 text-fg mb-2">{{ product.name }}</h3>
                <p class="small text-muted mb-3">{{ product.description }}</p>
                <div class="flex justify-between items-center">
                  <span class="body font-bold text-accent">{{ product.price }}</span>
                  <button class="bg-accent text-accent-on px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors">
                    Agregar al carrito
                  </button>
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
          Haz tu pedido online y recíbelo en menos de 30 minutos. 
          ¡Haz tu pedido ahora y prueba nuestra mejor hamburguesa!
        </p>
        <a routerLink="/catalog" class="bg-accent text-accent-on px-6 py-3 rounded-md text-lg font-medium hover:bg-orange-700 transition-colors">
          Ver Catálogo
        </a>
      </section>
    </main>
  `
})
export class HomeComponent {
  mockBannerData = mockBannerData;
  mockCategories = mockCategories;
  mockFeaturedProducts = mockFeaturedProducts;
  mockSiteSettings = mockSiteSettings;
}