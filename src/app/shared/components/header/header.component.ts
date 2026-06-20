import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header class="bg-surface border-b border-border">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <a routerLink="/" class="text-xl font-bold text-accent">BurgerApp</a>
        <nav class="hidden md:flex space-x-6">
          <a routerLink="/catalog" class="text-fg hover:text-accent">Catálogo</a>
          <a routerLink="/cart" class="text-fg hover:text-accent">Carrito</a>
          <a routerLink="/track" class="text-fg hover:text-accent">Seguimiento</a>
        </nav>
        <div class="flex items-center space-x-4">
          <a routerLink="/cart" class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="absolute -top-2 -right-2 bg-accent text-accent-on text-xs rounded-full h-5 w-5 flex items-center justify-center">{{ cartService.itemCount() }}</span>
          </a>
          <a routerLink="/staff/login" class="text-fg hover:text-accent">Staff</a>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  protected readonly cartService = inject(CartService);
}