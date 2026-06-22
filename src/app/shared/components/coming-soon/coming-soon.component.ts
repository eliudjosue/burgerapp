import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-xl mx-auto py-20 text-center px-4">
      <h1 class="text-3xl font-semibold mb-4">Próximamente</h1>
      <p class="text-muted mb-6">Esta sección está en construcción. Volveremos pronto.</p>
      <div class="flex justify-center gap-4">
        <a routerLink="/catalog" class="px-6 py-3 bg-accent text-accent-on rounded-md font-medium">Ir al catálogo</a>
        <a routerLink="/" class="px-6 py-3 border border-border rounded-md">Inicio</a>
      </div>
    </div>
  `,
})
export class ComingSoonComponent {}
