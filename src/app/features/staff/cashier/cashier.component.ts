import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SupabaseClientService } from '../../../core/supabase.client';
import { AuthService } from '../../../core/services/auth.service';

interface CashierOrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  line_total: number;
}

export interface CashierOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string | null;
  delivery_type: 'pickup' | 'delivery';
  comments: string | null;
  payment_method: 'cash' | 'transfer' | 'mercadopago';
  payment_status: 'pending_confirmation' | 'confirmed';
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way';
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  order_items: CashierOrderItem[];
}

const CASHIER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'on_the_way'] as const;
const CASHIER_STATUS_SET = new Set<string>(CASHIER_STATUSES);
const ACTIVE_STATUS_SET = new Set<string>(['confirmed', 'preparing', 'ready', 'on_the_way']);

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  on_the_way: 'En camino',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
};

const SELECT_FIELDS =
  'id, order_number, customer_name, customer_phone, address, delivery_type, comments, ' +
  'payment_method, payment_status, order_status, subtotal, shipping_cost, total, created_at, ' +
  'order_items(product_name, quantity, product_price, line_total)';

@Component({
  selector: 'app-cashier',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-dvh bg-[#f5f4f1]">

      <!-- Topbar -->
      <header
        class="bg-[#1c1a17] text-white px-3 py-2 flex items-center justify-between sticky top-0 z-20"
      >
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="goBack()"
            class="flex items-center gap-1 text-white/50 hover:text-white text-xs
                   cursor-pointer bg-transparent border-0 transition-colors"
            aria-label="Volver al panel"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Panel
          </button>
          <span class="font-semibold text-[15px] flex items-center gap-2">
            Caja
            @if (pendingOrders().length > 0) {
              <span
                class="bg-accent text-white px-1.5 py-px rounded-full font-mono text-[10px]"
                [attr.aria-label]="pendingOrders().length + ' pedidos pendientes'"
              >{{ pendingOrders().length }} pendientes</span>
            }
          </span>
        </div>
        <div class="flex items-center gap-3">
          <time
            class="font-mono text-[11px] text-white/40 tabular-nums"
            aria-label="Hora actual"
          >{{ currentTime() }}</time>
          <span class="text-[11px] text-white/40">
            {{ authService.staffProfile()?.name }}
          </span>
          <button
            type="button"
            (click)="logout()"
            class="text-[11px] text-white/30 underline cursor-pointer bg-transparent border-0"
          >
            Salir
          </button>
        </div>
      </header>

      <!-- New-order alert -->
      @if (newOrderAlert()) {
        <div
          role="alert"
          aria-live="assertive"
          class="fixed top-12 right-3 z-30 bg-accent text-white px-4 py-2.5
                 rounded-lg shadow-[0_4px_16px_rgba(212,83,46,0.3)]
                 flex items-center gap-2 text-[13px] font-medium"
          style="animation: slideIn 0.3s ease"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {{ newOrderAlert() }}
          <button
            type="button"
            (click)="dismissAlert()"
            class="text-white/70 hover:text-white cursor-pointer
                   bg-transparent border-0 p-0.5 leading-none ml-1"
            aria-label="Cerrar alerta"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }

      <!-- Stats bar -->
      <div class="px-3">
        <div
          class="flex gap-2 py-2.5 overflow-x-auto"
          style="-webkit-overflow-scrolling: touch"
          aria-label="Resumen de pedidos"
        >
          <div class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-surface border border-border text-xs font-medium whitespace-nowrap">
            <span
              class="w-2 h-2 rounded-full bg-accent inline-block"
              [class.animate-pulse]="pendingOrders().length > 0"
              aria-hidden="true"
            ></span>
            Por confirmar
            <span class="font-mono font-semibold text-sm">{{ pendingOrders().length }}</span>
          </div>
          <div class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-surface border border-border text-xs font-medium whitespace-nowrap">
            <span class="w-2 h-2 rounded-full bg-warn inline-block" aria-hidden="true"></span>
            En curso
            <span class="font-mono font-semibold text-sm">{{ activeOrders().length }}</span>
          </div>
        </div>
      </div>

      <!-- Main content -->
      @if (loading()) {
        <div class="flex items-center justify-center h-48 text-muted text-sm px-3">
          Cargando pedidos…
        </div>
      } @else {
        <div class="px-3 pb-8 max-w-5xl mx-auto">

          <!-- ═══ SECTION 1: Pending orders ═══ -->
          @if (pendingOrders().length > 0) {
            <section aria-label="Pedidos pendientes de confirmar" class="mb-6">
              <div class="flex items-center gap-2 text-[11px] font-semibold
                          uppercase tracking-wider text-muted py-3">
                <span
                  class="w-2 h-2 rounded-full bg-accent inline-block animate-pulse"
                  aria-hidden="true"
                ></span>
                Pendientes de confirmar
              </div>

              @for (order of pendingOrders(); track order.id) {
                <article
                  class="bg-surface border border-border border-l-4 border-l-accent
                         rounded-lg mb-3 overflow-hidden hover:shadow-sm transition-shadow"
                  [attr.aria-label]="'Pedido pendiente ' + order.order_number"
                >
                  <!-- Card header -->
                  <div class="flex justify-between items-center px-3.5 pt-3 pb-1.5">
                    <span class="font-bold text-[18px] tracking-[-0.01em] font-mono">
                      {{ order.order_number }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full
                               text-[10px] font-mono font-medium"
                        [class.bg-warn-soft]="order.payment_method === 'transfer'"
                        [class.text-warn]="order.payment_method === 'transfer'"
                        [class.bg-accent-soft]="order.payment_method === 'mercadopago'"
                        [class.text-accent]="order.payment_method === 'mercadopago'"
                        [class.bg-surface]="order.payment_method === 'cash'"
                        [class.text-muted]="order.payment_method === 'cash'"
                        [class.border]="order.payment_method === 'cash'"
                        [class.border-border]="order.payment_method === 'cash'"
                      >
                        {{ paymentMethodLabel(order.payment_method) }}
                      </span>
                      <span class="font-mono text-[10px] text-muted tabular-nums">
                        {{ timeAgo(order.created_at) }}
                      </span>
                    </div>
                  </div>

                  <!-- Customer info -->
                  <div class="px-3.5 pb-2.5 border-b border-border">
                    <div class="flex items-baseline gap-2 flex-wrap">
                      <span class="font-semibold text-[14px]">{{ order.customer_name }}</span>
                      <span class="font-mono text-[12px] text-muted">{{ order.customer_phone }}</span>
                    </div>
                    @if (order.delivery_type === 'delivery') {
                      <p class="text-[12px] text-muted mt-0.5 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2"
                             aria-hidden="true" class="shrink-0">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {{ order.address }}
                      </p>
                    } @else {
                      <p class="text-[12px] text-muted mt-0.5">Retiro en local</p>
                    }
                  </div>

                  <!-- Items with prices -->
                  <div class="px-3.5 py-2 border-b border-border">
                    <ul class="list-none p-0 m-0" aria-label="Items del pedido">
                      @for (item of order.order_items; track item.product_name) {
                        <li class="flex justify-between items-center py-0.5">
                          <div class="flex items-center gap-2">
                            <span class="font-mono text-[11px] text-muted min-w-[24px] shrink-0">
                              ×{{ item.quantity }}
                            </span>
                            <span class="text-[13px] break-words min-w-0">{{ item.product_name }}</span>
                          </div>
                          <span class="font-mono text-[12px] text-muted tabular-nums">
                            {{ formatCurrency(item.line_total) }}
                          </span>
                        </li>
                      }
                    </ul>
                  </div>

                  <!-- Footer: totals + confirm button -->
                  <div class="px-3.5 py-2.5">
                    @if (order.delivery_type === 'delivery' && order.shipping_cost > 0) {
                      <div class="flex justify-between text-[12px] text-muted mb-1">
                        <span>Envío</span>
                        <span class="font-mono tabular-nums">
                          {{ formatCurrency(order.shipping_cost) }}
                        </span>
                      </div>
                    }
                    <div class="flex justify-between items-center mb-2.5">
                      <span class="text-[13px] font-semibold">Total</span>
                      <span class="font-mono font-bold text-[17px] tabular-nums">
                        {{ formatCurrency(order.total) }}
                      </span>
                    </div>
                    @if (order.comments) {
                      <p class="text-[11px] text-accent bg-accent-soft
                                px-2 py-1 rounded mb-2.5 leading-snug">
                        {{ order.comments }}
                      </p>
                    }
                    <button
                      type="button"
                      (click)="confirmOrder(order)"
                      [disabled]="confirmingOrder() === order.id"
                      class="w-full py-2 rounded-lg text-[13px] font-semibold border-0
                             bg-accent text-white hover:opacity-90 active:scale-[0.97]
                             transition-all disabled:opacity-60 disabled:cursor-not-allowed
                             cursor-pointer"
                      [attr.aria-label]="'Confirmar pedido ' + order.order_number"
                    >
                      {{ confirmingOrder() === order.id ? 'Confirmando…' : 'Confirmar pedido' }}
                    </button>
                  </div>
                </article>
              }
            </section>
          }

          <!-- ═══ SECTION 2: Active orders ═══ -->
          <section aria-label="Pedidos en curso">
            @if (activeOrders().length > 0) {
              <div class="text-[11px] font-semibold uppercase tracking-wider text-muted py-3">
                Pedidos en curso
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                @for (order of activeOrders(); track order.id) {
                  <article
                    class="bg-surface border border-border rounded-lg overflow-hidden
                           border-l-4"
                    [class.border-l-warn]="order.order_status === 'confirmed'"
                    [class.border-l-accent]="order.order_status === 'preparing' || order.order_status === 'on_the_way'"
                    [class.border-l-success]="order.order_status === 'ready'"
                    [attr.aria-label]="'Pedido ' + order.order_number + ' — ' + orderStatusLabel(order.order_status)"
                  >
                    <!-- Header -->
                    <div class="flex justify-between items-start px-3 pt-3 pb-2">
                      <div>
                        <span class="font-bold text-[16px] tracking-[-0.01em] font-mono block">
                          {{ order.order_number }}
                        </span>
                        <span class="text-[12px] text-muted truncate block">
                          {{ order.customer_name }}
                          <span class="font-mono">· {{ order.customer_phone }}</span>
                        </span>
                      </div>
                      <div class="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full
                                 text-[10px] font-mono font-medium"
                          [class.bg-accent-soft]="order.order_status !== 'ready'"
                          [class.text-accent]="order.order_status !== 'ready'"
                          [class.bg-success-soft]="order.order_status === 'ready'"
                          [class.text-success]="order.order_status === 'ready'"
                        >
                          {{ orderStatusLabel(order.order_status) }}
                        </span>
                        <span class="font-mono text-[10px] text-muted tabular-nums">
                          {{ timeAgo(order.created_at) }}
                        </span>
                      </div>
                    </div>

                    <!-- Delivery type -->
                    <div class="px-3 pb-1.5">
                      <span class="text-[11px] text-muted">
                        @if (order.delivery_type === 'delivery') {
                          Delivery
                          @if (order.address) {
                            · <span class="truncate">{{ order.address }}</span>
                          }
                        } @else {
                          Retiro en local
                        }
                      </span>
                    </div>

                    <!-- Items + total -->
                    <div class="px-3 py-2 border-t border-b border-border">
                      <ul class="list-none p-0 m-0" aria-label="Items del pedido">
                        @for (item of order.order_items; track item.product_name) {
                          <li class="flex justify-between items-center py-0.5">
                            <div class="flex items-center gap-1.5">
                              <span class="font-mono text-[11px] text-muted shrink-0">
                                ×{{ item.quantity }}
                              </span>
                              <span class="text-[12px] break-words min-w-0">{{ item.product_name }}</span>
                            </div>
                            <span class="font-mono text-[11px] text-muted tabular-nums">
                              {{ formatCurrency(item.line_total) }}
                            </span>
                          </li>
                        }
                      </ul>
                      <div class="flex justify-between items-center pt-1.5 mt-1
                                  border-t border-border/50">
                        <span class="text-[12px] font-semibold">Total</span>
                        <span class="font-mono font-bold text-[14px] tabular-nums">
                          {{ formatCurrency(order.total) }}
                        </span>
                      </div>
                    </div>

                    <!-- Payment section -->
                    <div class="px-3 py-2.5">
                      <div class="flex items-center justify-between gap-2 flex-wrap">
                        <!-- Payment badge -->
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full
                                 text-[10px] font-mono font-medium"
                          [class.bg-success-soft]="order.payment_status === 'confirmed'"
                          [class.text-success]="order.payment_status === 'confirmed'"
                          [class.bg-warn-soft]="order.payment_status === 'pending_confirmation' && order.payment_method !== 'cash'"
                          [class.text-warn]="order.payment_status === 'pending_confirmation' && order.payment_method !== 'cash'"
                          [class.bg-surface]="order.payment_method === 'cash' && order.payment_status === 'pending_confirmation'"
                          [class.text-muted]="order.payment_method === 'cash' && order.payment_status === 'pending_confirmation'"
                          [class.border]="order.payment_method === 'cash' && order.payment_status === 'pending_confirmation'"
                          [class.border-border]="order.payment_method === 'cash' && order.payment_status === 'pending_confirmation'"
                        >
                          {{ paymentBadgeText(order) }}
                        </span>

                        <!-- Confirm payment button (transfer + pending only) -->
                        @if (needsPaymentConfirm(order) && expandedPaymentOrderId() !== order.id) {
                          <button
                            type="button"
                            (click)="openPaymentConfirm(order)"
                            class="text-[11px] font-semibold border border-success/40
                                   bg-success-soft text-success px-2.5 py-1 rounded-lg
                                   cursor-pointer hover:bg-success hover:text-white
                                   transition-colors"
                            [attr.aria-label]="'Confirmar pago para pedido ' + order.order_number"
                          >
                            Confirmar pago
                          </button>
                        }
                      </div>

                      <!-- Inline payment note form -->
                      @if (expandedPaymentOrderId() === order.id) {
                        <div class="mt-2 pt-2 border-t border-border">
                          <label
                            [for]="'note-' + order.id"
                            class="block text-[11px] text-muted font-medium mb-1"
                          >
                            Nro. de comprobante (opcional)
                          </label>
                          <input
                            [id]="'note-' + order.id"
                            type="text"
                            [value]="paymentNote()"
                            (input)="paymentNote.set($any($event.target).value)"
                            placeholder="Ej: 1234567890"
                            class="w-full text-[12px] px-2.5 py-1.5 rounded-lg border border-border
                                   focus:outline-none focus:border-accent bg-[#f5f4f1]"
                          />
                          <div class="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              (click)="submitPaymentConfirm(order)"
                              [disabled]="submittingPayment()"
                              class="flex-1 py-1.5 rounded-lg text-[12px] font-semibold border-0
                                     bg-success text-white hover:opacity-90 active:scale-[0.97]
                                     transition-all disabled:opacity-60 disabled:cursor-not-allowed
                                     cursor-pointer"
                            >
                              {{ submittingPayment() ? 'Confirmando…' : 'Confirmar pago' }}
                            </button>
                            <button
                              type="button"
                              (click)="cancelPaymentConfirm()"
                              [disabled]="submittingPayment()"
                              class="py-1.5 px-3 rounded-lg text-[12px] text-muted border border-border
                                     bg-transparent hover:border-muted transition-colors
                                     cursor-pointer disabled:opacity-60"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Delivery action button -->
                    @if (deliveryNextStatus(order)) {
                      <div class="px-3 pb-3 border-t border-border/50 pt-2">
                        <button
                          type="button"
                          (click)="advanceDelivery(order)"
                          [disabled]="advancing() === order.id"
                          class="w-full py-1.5 rounded-lg text-[12px] font-semibold border-0
                                 bg-success text-white hover:opacity-90 active:scale-[0.97]
                                 transition-all disabled:opacity-60 disabled:cursor-not-allowed
                                 cursor-pointer"
                          [attr.aria-label]="deliveryActionLabel(order) + ' ' + order.order_number"
                        >
                          {{ advancing() === order.id ? 'Guardando…' : deliveryActionLabel(order) }}
                        </button>
                      </div>
                    }
                  </article>
                }
              </div>

            } @else if (pendingOrders().length === 0) {
              <div class="flex flex-col items-center justify-center py-16 text-muted
                          text-center gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5"
                     class="opacity-20" aria-hidden="true">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-sm">Sin pedidos activos</p>
              </div>
            }
          </section>

        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
    `,
  ],
})
export class CashierComponent implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  readonly orders = signal<CashierOrder[]>([]);
  readonly loading = signal(true);
  readonly newOrderAlert = signal<string | null>(null);
  readonly currentTime = signal('');
  readonly confirmingOrder = signal<string | null>(null);
  readonly advancing = signal<string | null>(null);
  readonly expandedPaymentOrderId = signal<string | null>(null);
  readonly paymentNote = signal('');
  readonly submittingPayment = signal(false);

  readonly pendingOrders = computed(() =>
    this.orders().filter(o => o.order_status === 'pending'),
  );
  readonly activeOrders = computed(() =>
    this.orders().filter(o => ACTIVE_STATUS_SET.has(o.order_status)),
  );

  private channel: RealtimeChannel | null = null;
  private clockIntervalId = 0;
  private alertTimeoutId = 0;

  async ngOnInit(): Promise<void> {
    this.updateClock();
    this.clockIntervalId = window.setInterval(() => this.updateClock(), 30_000);
    await this.loadOrders();
    this.subscribeRealtime();
    this.loading.set(false);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.clockIntervalId);
    window.clearTimeout(this.alertTimeoutId);
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
  }

  async confirmOrder(order: CashierOrder): Promise<void> {
    this.confirmingOrder.set(order.id);
    try {
      const { error } = await this.supabase.client.rpc('advance_order_status', {
        p_order_id: order.id,
        p_new_status: 'confirmed',
      });
      if (!error) {
        this.orders.update(orders =>
          orders.map(o =>
            o.id === order.id ? { ...o, order_status: 'confirmed' as const } : o,
          ),
        );
      }
    } finally {
      this.confirmingOrder.set(null);
    }
  }

  async advanceDelivery(order: CashierOrder): Promise<void> {
    const nextStatus = this.deliveryNextStatus(order);
    if (!nextStatus) return;

    this.advancing.set(order.id);
    try {
      const { error } = await this.supabase.client.rpc('advance_order_status', {
        p_order_id: order.id,
        p_new_status: nextStatus,
      });
      if (!error) {
        // 'delivered' exits the cashier view — remove it; 'on_the_way' stays in scope.
        if (nextStatus === 'delivered') {
          this.orders.update(orders => orders.filter(o => o.id !== order.id));
        } else {
          this.orders.update(orders =>
            orders.map(o => o.id === order.id ? { ...o, order_status: nextStatus } : o),
          );
        }
      }
    } finally {
      this.advancing.set(null);
    }
  }

  openPaymentConfirm(order: CashierOrder): void {
    this.expandedPaymentOrderId.set(order.id);
    this.paymentNote.set('');
  }

  cancelPaymentConfirm(): void {
    this.expandedPaymentOrderId.set(null);
    this.paymentNote.set('');
  }

  async submitPaymentConfirm(order: CashierOrder): Promise<void> {
    this.submittingPayment.set(true);
    const reference = this.paymentNote().trim() || null;
    try {
      const { error } = await this.supabase.client.rpc('confirm_manual_payment', {
        p_order_id: order.id,
        p_reference: reference,
      });
      if (!error) {
        this.orders.update(orders =>
          orders.map(o =>
            o.id === order.id ? { ...o, payment_status: 'confirmed' as const } : o,
          ),
        );
        this.cancelPaymentConfirm();
      }
    } finally {
      this.submittingPayment.set(false);
    }
  }

  needsPaymentConfirm(order: CashierOrder): boolean {
    return order.payment_method === 'transfer' && order.payment_status === 'pending_confirmation';
  }

  deliveryNextStatus(order: CashierOrder): 'on_the_way' | 'delivered' | null {
    if (order.order_status === 'ready') {
      return order.delivery_type === 'delivery' ? 'on_the_way' : 'delivered';
    }
    if (order.order_status === 'on_the_way') {
      return 'delivered';
    }
    return null;
  }

  deliveryActionLabel(order: CashierOrder): string {
    const next = this.deliveryNextStatus(order);
    if (next === 'on_the_way') return 'Iniciar entrega';
    if (next === 'delivered') {
      return order.order_status === 'on_the_way' ? 'Marcar entregado' : 'Entregar';
    }
    return '';
  }

  paymentBadgeText(order: CashierOrder): string {
    if (order.payment_status === 'confirmed') {
      if (order.payment_method === 'mercadopago') return 'MP · Pagado';
      if (order.payment_method === 'transfer') return 'Transf. OK';
      return 'Efectivo';
    }
    if (order.payment_method === 'transfer') return 'Transf. pendiente';
    if (order.payment_method === 'mercadopago') return 'MP · pendiente';
    return 'Efectivo al entregar';
  }

  paymentMethodLabel(method: string): string {
    return PAYMENT_METHOD_LABELS[method] ?? method;
  }

  orderStatusLabel(status: string): string {
    return ORDER_STATUS_LABELS[status] ?? status;
  }

  timeAgo(timestamp: string): string {
    const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000);
    if (mins < 1) return 'recién';
    if (mins === 1) return 'hace 1 min';
    return `hace ${mins} min`;
  }

  formatCurrency(amount: number): string {
    return '$' + new Intl.NumberFormat('es-AR').format(amount);
  }

  dismissAlert(): void {
    window.clearTimeout(this.alertTimeoutId);
    this.newOrderAlert.set(null);
  }

  goBack(): void {
    this.router.navigate(['/staff']);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }

  private async loadOrders(): Promise<void> {
    const { data } = await this.supabase.client
      .from('orders')
      .select(SELECT_FIELDS)
      .in('order_status', [...CASHIER_STATUSES])
      .order('created_at', { ascending: true });

    if (data) {
      this.orders.set(data as unknown as CashierOrder[]);
    }
  }

  private subscribeRealtime(): void {
    this.channel = this.supabase.client
      .channel('cashier-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          this.ngZone.run(() => void this.handleOrderChange(payload));
        },
      )
      .subscribe();
  }

  private async handleOrderChange(
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ): Promise<void> {
    if (payload.eventType === 'DELETE') {
      const id = (payload.old as { id?: string }).id;
      if (id) this.orders.update(orders => orders.filter(o => o.id !== id));
      return;
    }

    const row = payload.new as { id: string; order_status: string; order_number?: string };
    if (!row.id) return;

    if (CASHIER_STATUS_SET.has(row.order_status)) {
      await this.loadSingleOrder(row.id);
      if (row.order_status === 'pending') {
        this.showAlert(`Nuevo pedido ${row.order_number ?? ''}`);
      }
    } else {
      // Order moved to delivered/cancelled — remove from view.
      this.orders.update(orders => orders.filter(o => o.id !== row.id));
    }
  }

  private async loadSingleOrder(orderId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('orders')
      .select(SELECT_FIELDS)
      .eq('id', orderId)
      .single();

    if (!data) return;

    this.orders.update(orders => {
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        const updated = [...orders];
        updated[idx] = data as unknown as CashierOrder;
        return updated;
      }
      return [...orders, data as unknown as CashierOrder].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });
  }

  private showAlert(message: string): void {
    window.clearTimeout(this.alertTimeoutId);
    this.newOrderAlert.set(message);
    this.alertTimeoutId = window.setTimeout(() => {
      this.newOrderAlert.set(null);
    }, 5_000);
  }

  private updateClock(): void {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.currentTime.set(`${hh}:${mm}`);
  }
}
