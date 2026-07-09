import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  template: `
    <footer class="bg-surface border-t border-border mt-12">
      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-center md:text-left">
            <a routerLink="/" class="text-xl font-bold text-accent">BurgerApp</a>
            <p class="text-muted text-sm mt-2">Hamburguesas artesanales desde 2024</p>
          </div>
          <div class="flex flex-col items-center md:items-end gap-2">
            <a
              href="https://wa.me/XXXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 bg-success text-accent-on px-4 py-2 rounded-md text-sm font-medium hover:bg-success/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contactanos por WhatsApp
            </a>
            <p class="text-muted text-xs">Horarios: Lunes a Domingo 11:00 - 22:00</p>
          </div>
        </div>
        <div class="border-t border-border mt-6 pt-6 text-center text-muted text-sm">
          <p class="break-words">© {{ getCurrentYear() }} BurgerApp. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}