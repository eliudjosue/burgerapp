import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  template: `
    <footer class="bg-surface border-t border-border mt-12">
      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <a routerLink="/" class="text-xl font-bold text-accent">BurgerApp</a>
            <p class="text-muted text-sm mt-2">Hamburguesas artesanales desde 2024</p>
          </div>
          <div class="flex flex-col items-center md:items-end">
            <a href="https://wa.me/XXXXXXXXXXX" target="_blank" class="bg-success text-accent-on px-4 py-2 rounded-md text-sm font-medium hover:bg-success/90 transition-colors">
              Contactanos por WhatsApp
            </a>
            <p class="text-muted text-xs mt-2">Horarios: Lunes a Domingo 11:00 - 22:00</p>
          </div>
        </div>
        <div class="border-t border-border mt-6 pt-6 text-center text-muted text-sm">
          <p>© {{ getCurrentYear() }} BurgerApp. Todos los derechos reservados.</p>
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