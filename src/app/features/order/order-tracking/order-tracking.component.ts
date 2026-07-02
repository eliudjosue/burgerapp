import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService, TrackedOrder } from '../../../core/services/order.service';

type TimelineStepState = 'done' | 'active' | 'pending';

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  state: TimelineStepState;
  dotClass: string;
  labelClass: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pedido recibido',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  on_the_way: 'En camino',
  delivered: 'Entregado',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: 'Lo recibimos y ya lo estamos revisando',
  confirmed: 'Tu pedido fue aceptado y pasó a cocina',
  preparing: 'Estamos preparando tu pedido',
  ready: 'Tu pedido está listo y empaquetado',
  on_the_way: 'Tu pedido está en camino',
  delivered: 'Pedido entregado con éxito',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-warn-soft text-warn',
  confirmed: 'bg-accent-soft text-accent',
  preparing: 'bg-accent-soft text-accent',
  ready: 'bg-success-soft text-success',
  on_the_way: 'bg-accent-soft text-accent',
  delivered: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
  rejected:  'bg-orange-soft text-orange',
};

const STATUS_DISPLAY: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  rejected:  'Rechazado',
};

const STEP_DOT_CLASSES: Record<TimelineStepState, string> = {
  done: 'absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 z-10 border-success bg-success',
  active:
    'absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 z-10 border-accent bg-surface ring-4 ring-accent/20',
  pending:
    'absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 z-10 border-border bg-surface',
};

const STEP_LABEL_CLASSES: Record<TimelineStepState, string> = {
  done: 'text-sm font-semibold text-fg',
  active: 'text-sm font-semibold text-accent',
  pending: 'text-sm font-semibold text-muted',
};

const PICKUP_STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
const DELIVERY_STATUS_ORDER = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
];

@Component({
  selector: 'app-order-tracking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-6 pb-24">
      <!-- Page header -->
      <div class="flex items-center gap-3 mb-6">
        <a
          routerLink="/"
          class="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-bg transition-colors"
          aria-label="Volver al inicio"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5 text-fg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 class="text-xl font-semibold text-fg">Estado del pedido</h1>
      </div>

      <!-- Last order shortcut -->
      @if (lastOrder() && !orderResult()) {
        @let saved = lastOrder()!;
        <div class="bg-accent-soft border border-accent/20 rounded-md p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-fg">
            ¿Querés ver el estado de tu último pedido
            <span class="font-mono font-semibold text-accent">#{{ saved.orderNumber }}</span>?
          </p>
          <button
            type="button"
            (click)="trackLastOrder()"
            [disabled]="searching()"
            class="shrink-0 px-4 py-2 bg-accent text-accent-on text-sm font-semibold rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-70"
          >
            Ver estado
          </button>
        </div>
      }

      <!-- Search form -->
      <div class="bg-surface border border-border rounded-md p-5 mb-4">
        <h2 class="text-sm font-semibold text-fg mb-4">Consultar pedido</h2>
        <form [formGroup]="searchForm" (ngSubmit)="onSearch()" novalidate>
          <div class="space-y-4">
            <div>
              <label for="orderNumber" class="block text-xs font-medium text-muted mb-1">
                Número de pedido
              </label>
              <input
                id="orderNumber"
                type="text"
                formControlName="orderNumber"
                placeholder="Ej: BH-0421"
                autocomplete="off"
                class="w-full border border-border rounded-sm px-3 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                [attr.aria-invalid]="searchForm.get('orderNumber')?.invalid && searchForm.get('orderNumber')?.touched ? true : null"
                aria-describedby="orderNumber-error"
              />
              @if (searchForm.get('orderNumber')?.invalid && searchForm.get('orderNumber')?.touched) {
                <p id="orderNumber-error" class="text-xs text-danger mt-1" role="alert">
                  Ingresá el número de pedido
                </p>
              }
            </div>

            <div>
              <label for="trackPhone" class="block text-xs font-medium text-muted mb-1">
                Teléfono
              </label>
              <input
                id="trackPhone"
                type="tel"
                formControlName="phone"
                placeholder="Ej: 11 2345 6789"
                autocomplete="tel"
                class="w-full border border-border rounded-sm px-3 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                [attr.aria-invalid]="searchForm.get('phone')?.invalid && searchForm.get('phone')?.touched ? true : null"
                aria-describedby="phone-error"
              />
              @if (searchForm.get('phone')?.invalid && searchForm.get('phone')?.touched) {
                <p id="phone-error" class="text-xs text-danger mt-1" role="alert">
                  Ingresá tu teléfono
                </p>
              }
            </div>

            <button
              type="submit"
              [disabled]="searching()"
              class="w-full py-3 bg-accent text-accent-on font-semibold text-sm rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-70"
            >
              {{ searching() ? 'Consultando...' : 'Consultar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Network error -->
      @if (searchError()) {
        <div role="alert" class="bg-danger-soft border border-danger/20 rounded-md p-4 mb-4 text-sm text-danger">
          {{ searchError() }}
        </div>
      }

      <!-- Not found -->
      @if (notFound()) {
        <div role="alert" class="bg-surface border border-border rounded-md p-6 text-center mb-4">
          <p class="text-fg font-medium mb-1">No encontramos un pedido con esos datos.</p>
          <p class="text-sm text-muted">Revisá el número de pedido y el teléfono ingresados.</p>
        </div>
      }

      <!-- Order result -->
      @if (orderResult(); as order) {
        <div class="space-y-4">
          <!-- Header: order number + status badge -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-mono font-bold text-xl text-fg">Pedido #{{ order.orderNumber }}</span>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-mono uppercase tracking-wide"
              [class]="badgeClasses()"
            >
              {{ statusDisplay() }}
            </span>
          </div>

          <!-- Cancelled notice -->
          @if (order.orderStatus === 'cancelled') {
            <div class="bg-danger-soft border border-danger/20 rounded-md p-4 text-sm text-danger">
              Este pedido fue cancelado. Si tenés dudas, podés comunicarte con nosotros.
            </div>
          }

          <!-- Rejected notice -->
          @if (order.orderStatus === 'rejected') {
            <div class="bg-orange-soft border border-orange/20 rounded-md p-4 text-sm text-orange">
              No pudimos tomar tu pedido esta vez. Si realizaste un pago, estamos gestionando el reintegro. Comunicate con nosotros si tenés dudas.
            </div>
          }

          <!-- Timeline -->
          @if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'rejected') {
            <div class="bg-surface border border-border rounded-md p-5">
              <h3 class="text-sm font-semibold text-fg mb-5">Estado actual</h3>
              <ol class="relative pl-7" aria-label="Progreso del pedido">
                <div
                  class="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border"
                  aria-hidden="true"
                ></div>
                @for (step of timelineSteps(); track step.status) {
                  <li class="relative pb-5 last:pb-0">
                    <div [class]="step.dotClass" aria-hidden="true"></div>
                    <div [class]="step.state === 'pending' ? 'opacity-40' : ''">
                      <p [class]="step.labelClass">{{ step.label }}</p>
                      <p class="text-xs text-muted mt-0.5">{{ step.description }}</p>
                    </div>
                  </li>
                }
              </ol>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class OrderTrackingComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly fb = inject(FormBuilder);

  readonly searchForm = this.fb.group({
    orderNumber: ['', [Validators.required]],
    phone: ['', [Validators.required]],
  });

  readonly lastOrder = signal<{ orderNumber: string; phone: string } | null>(null);
  readonly searching = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly orderResult = signal<TrackedOrder | null>(null);

  readonly timelineSteps = computed((): TimelineStep[] => {
    const order = this.orderResult();
    if (!order) return [];

    const statusOrder =
      order.deliveryType === 'delivery' ? DELIVERY_STATUS_ORDER : PICKUP_STATUS_ORDER;

    if (order.orderStatus === 'cancelled' || order.orderStatus === 'rejected') {
      return statusOrder.map(status => ({
        status,
        label: STATUS_LABELS[status] ?? status,
        description: STATUS_DESCRIPTIONS[status] ?? '',
        state: 'pending' as TimelineStepState,
        dotClass: STEP_DOT_CLASSES.pending,
        labelClass: STEP_LABEL_CLASSES.pending,
      }));
    }

    const currentIndex = statusOrder.indexOf(order.orderStatus);

    return statusOrder.map((status, i) => {
      const state: TimelineStepState =
        i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending';
      return {
        status,
        label: STATUS_LABELS[status] ?? status,
        description: STATUS_DESCRIPTIONS[status] ?? '',
        state,
        dotClass: STEP_DOT_CLASSES[state],
        labelClass: STEP_LABEL_CLASSES[state],
      };
    });
  });

  readonly badgeClasses = computed(() => {
    const order = this.orderResult();
    if (!order) return '';
    return (
      STATUS_BADGE_CLASSES[order.orderStatus] ??
      'bg-fg/5 text-muted'
    );
  });

  readonly statusDisplay = computed(() => {
    const order = this.orderResult();
    if (!order) return '';
    return STATUS_DISPLAY[order.orderStatus] ?? order.orderStatus;
  });

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('last_order');
      if (raw) {
        const parsed = JSON.parse(raw) as { orderNumber?: unknown; phone?: unknown };
        if (typeof parsed.orderNumber === 'string' && typeof parsed.phone === 'string') {
          this.lastOrder.set({ orderNumber: parsed.orderNumber, phone: parsed.phone });
        }
      }
    } catch {
      // ignore invalid stored data
    }
  }

  async onSearch(): Promise<void> {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const { orderNumber, phone } = this.searchForm.getRawValue();

    this.searching.set(true);
    this.searchError.set(null);
    this.notFound.set(false);
    this.orderResult.set(null);

    try {
      const result = await this.orderService.trackOrder(orderNumber!, phone!);
      if (result) {
        this.orderResult.set(result);
      } else {
        this.notFound.set(true);
      }
    } catch {
      this.searchError.set('No se pudo conectar. Por favor intentá de nuevo.');
    } finally {
      this.searching.set(false);
    }
  }

  trackLastOrder(): void {
    const saved = this.lastOrder();
    if (!saved) return;
    this.searchForm.setValue({ orderNumber: saved.orderNumber, phone: saved.phone });
    void this.onSearch();
  }
}
