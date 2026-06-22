import { Component, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-12">
      <div class="bg-surface border border-border rounded-md p-8 text-center">
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-success" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <h1 class="h1 mb-2">¡Pedido confirmado!</h1>
        <p class="text-muted mb-6">Tu pedido está siendo preparado. Guardá este número para hacer el seguimiento.</p>
        
        <div class="mb-8">
          <span class="font-mono text-2xl font-bold">ID: {{ orderId() }}</span>
        </div>
        
        <div class="mb-8">
          <p class="mb-6">Número de pedido: <strong>{{ orderId() }}</strong></p>
          <p class="text-small text-muted">Para hacer el seguimiento del pedido, ingresa este número en la pantalla de seguimiento.</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/track" class="px-6 py-3 bg-accent text-accent-on rounded-md font-medium hover:bg-accent/90 transition-colors">
            Hacer seguimiento
          </a>
          <a routerLink="/" class="px-6 py-3 bg-surface border border-border rounded-md font-medium hover:bg-surface/90 transition-colors">
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class OrderConfirmationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  
  orderId = signal<string>('');

  constructor() {
    // Leer el parámetro de orderId desde la URL
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      if (!orderId) {
        // Redirigir a la página principal si no hay orderId
        this.router.navigate(['/']);
        return;
      }
      this.orderId.set(orderId);
    });
  }
}