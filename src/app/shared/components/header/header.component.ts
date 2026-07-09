import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SiteSettingsService } from '../../../core/services/site-settings.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  host: {
    '(keydown.escape)': 'menuOpen.set(false)',
  },
  template: `
    <header class="bg-surface border-b border-border sticky top-0 z-40">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between gap-4">

        <!-- Logo / wordmark -->
        <a routerLink="/"
           aria-label="BurgerApp — Inicio"
           class="flex items-center gap-2.5 shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
          @if (logoUrl()) {
            <img
              #logoImg
              [src]="logoUrl()!"
              alt=""
              aria-hidden="true"
              class="h-8 md:h-9 w-auto object-contain rounded-lg"
              (error)="logoImg.style.display='none'"
            >
          }
          <span class="text-xl font-bold text-accent">BurgerApp</span>
        </a>

        <!-- Nav desktop -->
        <nav class="hidden md:flex items-center gap-6" aria-label="Navegación principal">
          <a routerLink="/catalog"
             routerLinkActive="!text-accent font-semibold"
             class="text-sm text-fg hover:text-accent transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
            Catálogo
          </a>
          <a routerLink="/track"
             routerLinkActive="!text-accent font-semibold"
             class="text-sm text-fg hover:text-accent transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
            Seguimiento
          </a>
        </nav>

        <!-- Acciones derecha -->
        <div class="flex items-center gap-2 md:gap-3 shrink-0">

          <!-- Carrito pill — desktop -->
          <a routerLink="/cart"
             aria-label="Ir al carrito"
             class="relative hidden md:inline-flex items-center gap-1.5 bg-accent text-accent-on px-4 py-2 rounded-full text-sm font-semibold hover:bg-accent/90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Carrito
            <span
              class="absolute -top-2 -right-2 bg-fg text-surface text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center leading-none"
              [class.badge-bump-anim]="badgePulse()"
            >
              {{ cartService.itemCount() }}
            </span>
          </a>

          <!-- Carrito icono — mobile -->
          <a routerLink="/cart"
             aria-label="Ir al carrito"
             class="relative md:hidden p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span
              class="absolute -top-1 -right-1 bg-accent text-accent-on text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center leading-none"
              [class.badge-bump-anim]="badgePulse()"
            >
              {{ cartService.itemCount() }}
            </span>
          </a>

          <!-- Staff — desktop -->
          <a routerLink="/staff/login"
             class="hidden md:inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Staff
          </a>

          <!-- Hamburguesa — mobile -->
          <button
            type="button"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-label]="menuOpen() ? 'Cerrar menú' : 'Abrir menú'"
            aria-controls="mobile-nav"
            class="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-fg hover:bg-fg-soft active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            (click)="menuOpen.update(v => !v)"
          >
            @if (menuOpen()) {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          </button>

        </div>
      </div>

      <!-- Panel mobile -->
      @if (menuOpen()) {
        <nav id="mobile-nav"
             class="md:hidden border-t border-border bg-surface px-4 py-2"
             aria-label="Menú mobile">
          <a routerLink="/catalog"
             routerLinkActive="!text-accent font-semibold"
             class="flex items-center px-3 py-3 rounded-md text-sm text-fg hover:bg-fg-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
             (click)="menuOpen.set(false)">
            Catálogo
          </a>
          <a routerLink="/track"
             routerLinkActive="!text-accent font-semibold"
             class="flex items-center px-3 py-3 rounded-md text-sm text-fg hover:bg-fg-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
             (click)="menuOpen.set(false)">
            Seguimiento
          </a>
          <a routerLink="/staff/login"
             class="flex items-center gap-2 px-3 py-3 rounded-md text-sm text-muted hover:bg-fg-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
             (click)="menuOpen.set(false)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Staff
          </a>
        </nav>
      }
    </header>
  `,
})
export class HeaderComponent implements OnInit {
  protected readonly cartService = inject(CartService);
  private readonly siteSettingsService = inject(SiteSettingsService);

  readonly logoUrl = signal<string | null>(null);
  readonly menuOpen = signal(false);
  readonly badgePulse = signal(false);
  private badgePulseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    let prevCount = this.cartService.itemCount();
    effect(() => {
      const count = this.cartService.itemCount();
      if (count > prevCount) {
        prevCount = count;
        if (this.badgePulseTimer !== null) clearTimeout(this.badgePulseTimer);
        // Reset first so the animation restarts cleanly on rapid adds
        this.badgePulse.set(false);
        setTimeout(() => {
          this.badgePulse.set(true);
          this.badgePulseTimer = setTimeout(() => this.badgePulse.set(false), 400);
        }, 0);
      } else {
        prevCount = count;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const settings = await this.siteSettingsService.getSettings();
      this.logoUrl.set(settings.logoUrl);
    } catch {
      // logoUrl stays null → wordmark shown as fallback
    }
  }
}
