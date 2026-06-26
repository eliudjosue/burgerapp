import { Component, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-12">
      <div class="bg-surface border border-border rounded-md p-8 text-center">
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-success" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <h1 class="h1 mb-2">¡Pedido confirmado!</h1>
        <p class="text-muted mb-6">Tu pedido está siendo preparado. Guardá este número para hacer el seguimiento.</p>

        <div class="mb-8">
          <span class="font-mono text-2xl font-bold">Nº {{ orderNumber() }}</span>
        </div>

        <div class="mb-8">
          <p class="mb-6">Número de pedido: <strong>{{ orderNumber() }}</strong></p>
          <p class="text-small text-muted">Para hacer el seguimiento del pedido, ingresá este número en la pantalla de seguimiento.</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/track" class="px-6 py-3 bg-accent text-accent-on rounded-md font-medium hover:bg-accent/90 transition-colors">
            Hacer seguimiento
          </a>
          <a routerLink="/" class="px-6 py-3 bg-surface border border-border rounded-md font-medium hover:bg-surface/90 transition-colors">
            Volver al inicio
          </a>
        </div>

        <div class="mt-6 pt-6 border-t border-border">
          <p class="text-xs text-muted mb-3">¿Querés compartir tu número de pedido?</p>
          <a
            [href]="whatsappUrl()"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm text-white transition-opacity hover:opacity-90"
            style="background-color: #25D366"
            aria-label="Compartir número de pedido por WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartir por WhatsApp
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

  readonly orderNumber = signal<string>('');

  readonly whatsappUrl = computed(() => {
    const number = this.orderNumber();
    if (!number) return 'https://wa.me/';
    const text = `Mi pedido en BurgerApp es el #${number}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  });

  constructor() {
    this.route.queryParams.subscribe(params => {
      const orderNumber = params['orderNumber'];
      if (!orderNumber) {
        this.router.navigate(['/']);
        return;
      }
      this.orderNumber.set(orderNumber);
    });
  }
}
