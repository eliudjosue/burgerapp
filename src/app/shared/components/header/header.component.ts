import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header class="bg-surface border-b border-border">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
        <a routerLink="/" class="text-xl font-bold text-accent shrink-0">BurgerApp</a>
        <nav class="hidden md:flex space-x-6">
          <a routerLink="/catalog" routerLinkActive="!text-accent font-semibold" class="text-fg hover:text-accent transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">Catálogo</a>
          <a routerLink="/cart" routerLinkActive="!text-accent font-semibold" class="text-fg hover:text-accent transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">Carrito</a>
          <a routerLink="/track" routerLinkActive="!text-accent font-semibold" class="text-fg hover:text-accent transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">Seguimiento</a>
        </nav>
        <div class="flex items-center space-x-4 shrink-0">
          <a routerLink="/cart" class="relative" aria-label="Ir al carrito">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="absolute -top-2 -right-2 bg-accent text-accent-on text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center leading-none">{{ cartService.itemCount() }}</span>
          </a>
          <a routerLink="/staff/login" class="text-fg hover:text-accent transition-colors">Staff</a>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  protected readonly cartService = inject(CartService);
}