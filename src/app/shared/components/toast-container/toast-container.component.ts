import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes toast-slide-in {
      from { transform: translateX(calc(100% + 1.5rem)); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    article {
      animation: toast-slide-in 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both;
    }
  `],
  template: `
    <div
      class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Notificaciones de pedidos"
    >
      @for (toast of svc.toasts(); track toast.id) {
        <article
          role="alert"
          class="pointer-events-auto flex items-start gap-3
                 bg-[#1c1a17] text-white border-l-[5px] border-accent
                 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-4
                 w-[22rem] max-w-[calc(100vw-2rem)]"
        >
          <!-- Bell icon -->
          <div class="shrink-0 mt-0.5 text-accent" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </div>

          <!-- Body -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-[14px] leading-tight">¡Nuevo pedido!</p>
            <p class="text-[12px] text-white/60 mt-0.5 font-mono tracking-wide">
              {{ toast.orderNumber }}&nbsp;·&nbsp;{{ formatCurrency(toast.total) }}
            </p>
            <div class="flex items-center gap-2 mt-3">
              <button
                type="button"
                (click)="svc.viewOrder(toast.id)"
                class="text-[12px] font-semibold bg-accent text-white px-3 py-1.5
                       rounded-md cursor-pointer border-0 hover:opacity-90 transition-opacity"
              >
                Ver pedido
              </button>
              <button
                type="button"
                (click)="svc.dismiss(toast.id)"
                class="text-[12px] text-white/40 hover:text-white/70 cursor-pointer
                       bg-transparent border-0 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>

          <!-- Close -->
          <button
            type="button"
            (click)="svc.dismiss(toast.id)"
            class="shrink-0 -mt-0.5 -mr-0.5 text-white/30 hover:text-white/70 cursor-pointer
                   bg-transparent border-0 transition-colors p-1"
            aria-label="Cerrar notificación"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </article>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly svc = inject(ToastService);

  formatCurrency(amount: number): string {
    return '$' + new Intl.NumberFormat('es-AR').format(amount);
  }
}
