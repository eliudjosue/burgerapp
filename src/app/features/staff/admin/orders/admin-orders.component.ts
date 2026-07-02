import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type PaymentMethod = 'cash' | 'transfer' | 'mercadopago';
export type PaymentStatus = 'pending_confirmation' | 'confirmed';

export interface AdminOrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: 'pickup' | 'delivery';
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  line_total: number;
}

export interface PaymentTransaction {
  provider: 'mercadopago' | 'manual';
  provider_reference: string | null;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface AdminOrderDetail extends AdminOrderRow {
  address: string | null;
  comments: string | null;
  subtotal: number;
  shipping_cost: number;
  order_items: OrderItem[];
  payment_transactions: PaymentTransaction[];
}

const PAGE_SIZE = 50;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  on_the_way: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  rejected:  'Rechazado',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending_confirmation: 'Pendiente',
  confirmed: 'Confirmado',
};

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const LIST_SELECT =
  'id, order_number, customer_name, customer_phone, delivery_type, ' +
  'total, payment_method, payment_status, order_status, created_at';

const DETAIL_SELECT =
  '*, ' +
  'order_items(product_name, quantity, product_price, line_total), ' +
  'payment_transactions(provider, provider_reference, amount, status, created_at)';

const BADGE_BASE = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold';

@Component({
  selector: 'app-admin-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-dvh bg-[#f5f4f1]">

      <!-- ─── Topbar ─────────────────────────────────────────────────────── -->
      <header
        class="bg-[#1c1a17] text-white px-3 py-2 flex items-center justify-between sticky top-0 z-20"
      >
        <div class="flex items-center gap-2.5">
          @if (view() === 'list') {
            <button
              type="button"
              (click)="goBack()"
              class="flex items-center gap-1 text-white/50 hover:text-white text-xs
                     cursor-pointer bg-transparent border-0 transition-colors"
              aria-label="Volver al dashboard de Admin"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Admin
            </button>
            <span class="font-semibold text-[15px]">Historial de pedidos</span>
          } @else {
            <button
              type="button"
              (click)="closeDetail()"
              class="flex items-center gap-1 text-white/50 hover:text-white text-xs
                     cursor-pointer bg-transparent border-0 transition-colors"
              aria-label="Volver al listado de pedidos"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Pedidos
            </button>
            <span class="font-semibold text-[15px]">
              {{ selectedOrder()?.order_number ?? 'Detalle' }}
            </span>
          }
        </div>
        <div class="flex items-center gap-3">
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

      <!-- ─── LIST VIEW ──────────────────────────────────────────────────── -->
      @if (view() === 'list') {
        <main class="px-3 pb-8 max-w-6xl mx-auto">

          <!-- Page header -->
          <div class="py-5">
            <h1 class="text-[22px] font-semibold text-fg tracking-tight">Historial de pedidos</h1>
            <p class="text-[13px] text-muted mt-0.5">
              Consulta y análisis · todos los estados
            </p>
          </div>

          <!-- Filters -->
          <div
            class="bg-surface border border-border rounded-lg p-4 mb-5"
            role="search"
            aria-label="Filtros de pedidos"
          >
            <div class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted mb-3">
              Filtros
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">

              <label class="block">
                <span class="text-[11px] font-medium text-muted block mb-1">Desde</span>
                <input
                  type="date"
                  [value]="filterDateFrom()"
                  (change)="onDateFromChange($any($event.target).value)"
                  class="w-full text-[13px] px-2.5 py-1.5 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
                  aria-label="Filtrar desde fecha"
                />
              </label>

              <label class="block">
                <span class="text-[11px] font-medium text-muted block mb-1">Hasta</span>
                <input
                  type="date"
                  [value]="filterDateTo()"
                  (change)="onDateToChange($any($event.target).value)"
                  class="w-full text-[13px] px-2.5 py-1.5 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
                  aria-label="Filtrar hasta fecha"
                />
              </label>

              <label class="block">
                <span class="text-[11px] font-medium text-muted block mb-1">Estado</span>
                <select
                  [value]="filterStatus()"
                  (change)="onStatusChange($any($event.target).value)"
                  class="w-full text-[13px] px-2.5 py-1.5 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg cursor-pointer"
                  aria-label="Filtrar por estado del pedido"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="preparing">En preparación</option>
                  <option value="ready">Listo</option>
                  <option value="on_the_way">En camino</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </label>

              <label class="block">
                <span class="text-[11px] font-medium text-muted block mb-1">Pago</span>
                <select
                  [value]="filterPayment()"
                  (change)="onPaymentChange($any($event.target).value)"
                  class="w-full text-[13px] px-2.5 py-1.5 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg cursor-pointer"
                  aria-label="Filtrar por método de pago"
                >
                  <option value="all">Todos los métodos</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </label>

            </div>

            @if (hasActiveFilters()) {
              <div class="mt-3 pt-3 border-t border-border">
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="text-[12px] text-accent underline cursor-pointer bg-transparent border-0"
                >
                  Limpiar filtros
                </button>
              </div>
            }
          </div>

          <!-- Loading -->
          @if (isLoading()) {
            <div class="flex items-center justify-center h-48 text-muted text-sm">
              Cargando pedidos…
            </div>
          }

          <!-- Error -->
          @else if (hasError()) {
            <div
              class="flex flex-col items-center justify-center py-16 text-center gap-2 px-4"
              role="alert"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5"
                   class="text-danger opacity-50" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p class="text-sm text-muted">No se pudo cargar el historial de pedidos.</p>
              <button
                type="button"
                (click)="loadOrders()"
                class="text-xs text-accent underline cursor-pointer bg-transparent border-0 mt-1"
              >
                Reintentar
              </button>
            </div>
          }

          <!-- Empty -->
          @else if (orders().length === 0) {
            <div class="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5"
                   class="text-muted opacity-30" aria-hidden="true">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-muted text-sm">
                Sin pedidos que coincidan con los filtros activos.
              </p>
              @if (hasActiveFilters()) {
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="text-accent text-sm underline cursor-pointer bg-transparent border-0"
                >
                  Limpiar filtros
                </button>
              }
            </div>
          }

          <!-- Table -->
          @else {
            <div class="text-[12px] text-muted mb-2" aria-live="polite">
              {{ orders().length }}{{ hasMore() ? '+' : '' }}
              pedido{{ orders().length === 1 ? '' : 's' }}
            </div>

            <div class="bg-surface border border-border rounded-lg overflow-hidden mb-4">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[760px]" aria-label="Historial de pedidos">
                  <thead>
                    <tr class="border-b border-border">
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted whitespace-nowrap">
                        #
                      </th>
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted whitespace-nowrap">
                        Fecha
                      </th>
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Cliente
                      </th>
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Tipo
                      </th>
                      <th scope="col"
                          class="text-right px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Total
                      </th>
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Método
                      </th>
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Est. pago
                      </th>
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of orders(); track order.id) {
                      <tr
                        class="border-b border-border/50 last:border-0
                               hover:bg-[rgba(28,26,23,0.04)] transition-colors
                               cursor-pointer focus:outline-none focus:bg-[rgba(212,83,46,0.06)]"
                        role="button"
                        tabindex="0"
                        (click)="openDetail(order)"
                        (keydown)="onRowKeydown($event, order)"
                        [attr.aria-label]="'Ver detalle del pedido ' + order.order_number"
                      >
                        <td class="px-4 py-3 font-mono font-semibold text-[13px] whitespace-nowrap">
                          {{ order.order_number }}
                        </td>
                        <td class="px-4 py-3 font-mono text-[12px] text-muted
                                   tabular-nums whitespace-nowrap">
                          {{ formatDateShort(order.created_at) }}
                        </td>
                        <td class="px-4 py-3">
                          <div class="text-[13px] font-medium text-fg">
                            {{ order.customer_name }}
                          </div>
                          <div class="font-mono text-[11px] text-muted">
                            {{ order.customer_phone }}
                          </div>
                        </td>
                        <td class="px-4 py-3 text-[12px] text-muted whitespace-nowrap">
                          {{ order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro' }}
                        </td>
                        <td class="px-4 py-3 text-right font-mono font-semibold
                                   text-[14px] tabular-nums whitespace-nowrap">
                          {{ formatCurrency(order.total) }}
                        </td>
                        <td class="px-4 py-3 text-[12px] text-muted whitespace-nowrap">
                          {{ paymentMethodLabel(order.payment_method) }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span [class]="paymentStatusBadgeClass(order.payment_status)">
                            {{ paymentStatusLabel(order.payment_status) }}
                          </span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <span [class]="orderStatusBadgeClass(order.order_status)">
                            {{ orderStatusLabel(order.order_status) }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            @if (hasMore()) {
              <div class="flex justify-center">
                <button
                  type="button"
                  (click)="loadMore()"
                  [disabled]="isLoadingMore()"
                  class="px-5 py-2 rounded-lg text-[13px] font-medium border border-border
                         bg-surface text-muted hover:border-accent hover:text-accent
                         transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                         cursor-pointer"
                >
                  {{ isLoadingMore() ? 'Cargando…' : 'Cargar más pedidos' }}
                </button>
              </div>
            }
          }

        </main>
      }

      <!-- ─── DETAIL VIEW ─────────────────────────────────────────────────── -->
      @if (view() === 'detail') {
        <main class="px-3 pb-8 max-w-3xl mx-auto pt-4" aria-label="Detalle del pedido">

          @if (detailLoading()) {
            <div class="flex items-center justify-center h-48 text-muted text-sm">
              Cargando detalle…
            </div>
          }

          @else if (detailError()) {
            <div
              class="flex flex-col items-center justify-center py-16 text-center gap-2"
              role="alert"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5"
                   class="text-danger opacity-50" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p class="text-sm text-muted">No se pudo cargar el detalle del pedido.</p>
              <button
                type="button"
                (click)="closeDetail()"
                class="text-xs text-accent underline cursor-pointer bg-transparent border-0 mt-1"
              >
                Volver al listado
              </button>
            </div>
          }

          @else if (selectedOrder(); as o) {

            <!-- Order header -->
            <div class="bg-surface border border-border rounded-lg p-4 mb-3">
              <div class="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div class="font-bold font-mono text-[22px] tracking-[-0.01em]">
                    {{ o.order_number }}
                  </div>
                  <div class="font-mono text-[12px] text-muted mt-0.5">
                    {{ formatDate(o.created_at) }}
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <span [class]="orderStatusBadgeClass(o.order_status)">
                    {{ orderStatusLabel(o.order_status) }}
                  </span>
                  <span [class]="paymentStatusBadgeClass(o.payment_status)">
                    {{ paymentMethodLabel(o.payment_method) }} · {{ paymentStatusLabel(o.payment_status) }}
                  </span>
                </div>
              </div>

              <!-- Customer -->
              <div class="border-t border-border pt-3">
                <div class="text-[11px] font-mono font-semibold uppercase tracking-wider
                            text-muted mb-2">
                  Cliente
                </div>
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="font-semibold text-[14px] text-fg">{{ o.customer_name }}</span>
                  <span class="font-mono text-[12px] text-muted">{{ o.customer_phone }}</span>
                </div>
                @if (o.delivery_type === 'delivery') {
                  <div class="mt-1 flex items-start gap-1 text-[12px] text-muted">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         aria-hidden="true" class="shrink-0 mt-px">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ o.address ?? '—' }}
                  </div>
                } @else {
                  <div class="mt-1 text-[12px] text-muted">Retiro en local</div>
                }
              </div>

              @if (o.comments) {
                <div class="mt-3 pt-3 border-t border-border">
                  <div class="text-[11px] font-mono font-semibold uppercase tracking-wider
                              text-muted mb-1">
                    Comentarios
                  </div>
                  <p class="text-[13px] text-fg italic">{{ o.comments }}</p>
                </div>
              }
            </div>

            <!-- Items -->
            <div class="bg-surface border border-border rounded-lg overflow-hidden mb-3">
              <div class="px-4 py-3 border-b border-border">
                <div class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                  Productos
                </div>
              </div>
              <table class="w-full" aria-label="Items del pedido">
                <thead>
                  <tr class="border-b border-border bg-[rgba(28,26,23,0.02)]">
                    <th scope="col"
                        class="text-left px-4 py-2 text-[11px] font-mono font-semibold
                               uppercase tracking-wider text-muted">
                      Producto
                    </th>
                    <th scope="col"
                        class="text-right px-4 py-2 text-[11px] font-mono font-semibold
                               uppercase tracking-wider text-muted">
                      P. unit.
                    </th>
                    <th scope="col"
                        class="text-right px-4 py-2 text-[11px] font-mono font-semibold
                               uppercase tracking-wider text-muted">
                      Cant.
                    </th>
                    <th scope="col"
                        class="text-right px-4 py-2 text-[11px] font-mono font-semibold
                               uppercase tracking-wider text-muted">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of o.order_items; track item.product_name) {
                    <tr class="border-b border-border/50 last:border-0">
                      <td class="px-4 py-3 text-[13px] text-fg">
                        {{ item.product_name }}
                      </td>
                      <td class="px-4 py-3 text-right font-mono text-[12px] text-muted tabular-nums">
                        {{ formatCurrency(item.product_price) }}
                      </td>
                      <td class="px-4 py-3 text-right font-mono text-[12px] text-muted tabular-nums">
                        ×{{ item.quantity }}
                      </td>
                      <td class="px-4 py-3 text-right font-mono text-[13px] tabular-nums">
                        {{ formatCurrency(item.line_total) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Totals -->
              <div class="px-4 py-3 border-t border-border bg-[rgba(28,26,23,0.02)]">
                @if (o.delivery_type === 'delivery' && o.shipping_cost > 0) {
                  <div class="flex justify-between text-[12px] text-muted mb-1">
                    <span>Subtotal</span>
                    <span class="font-mono tabular-nums">{{ formatCurrency(o.subtotal) }}</span>
                  </div>
                  <div class="flex justify-between text-[12px] text-muted mb-2">
                    <span>Envío</span>
                    <span class="font-mono tabular-nums">{{ formatCurrency(o.shipping_cost) }}</span>
                  </div>
                }
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-[14px] text-fg">Total</span>
                  <span class="font-mono font-bold text-[18px] tabular-nums text-fg">
                    {{ formatCurrency(o.total) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Payment transactions -->
            @if (o.payment_transactions.length > 0) {
              <div class="bg-surface border border-border rounded-lg overflow-hidden">
                <div class="px-4 py-3 border-b border-border">
                  <div class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                    Historial de transacciones de pago
                  </div>
                </div>
                <ul class="divide-y divide-border list-none p-0 m-0"
                    aria-label="Transacciones de pago">
                  @for (tx of o.payment_transactions; track $index) {
                    <li class="px-4 py-3 flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-[13px] font-medium text-fg">
                            {{ tx.provider === 'mercadopago' ? 'Mercado Pago' : 'Confirmación manual' }}
                          </span>
                          <span [class]="transactionStatusBadgeClass(tx.status)">
                            {{ transactionStatusLabel(tx.status) }}
                          </span>
                        </div>
                        @if (tx.provider_reference) {
                          <div class="font-mono text-[11px] text-muted mt-0.5 truncate">
                            Ref: {{ tx.provider_reference }}
                          </div>
                        }
                        <div class="font-mono text-[11px] text-muted mt-0.5">
                          {{ formatDate(tx.created_at) }}
                        </div>
                      </div>
                      <div class="font-mono font-semibold text-[14px] tabular-nums shrink-0">
                        {{ formatCurrency(tx.amount) }}
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }

          }

        </main>
      }

    </div>
  `,
  styles: `:host { display: block; }`,
})
export class AdminOrdersComponent implements OnInit {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ── View ──────────────────────────────────────────────────────────────────
  readonly view = signal<'list' | 'detail'>('list');

  // ── List state ────────────────────────────────────────────────────────────
  readonly orders = signal<AdminOrderRow[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly hasMore = signal(false);
  readonly isLoadingMore = signal(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  readonly filterDateFrom = signal('');
  readonly filterDateTo = signal('');
  readonly filterStatus = signal<OrderStatus | 'all'>('all');
  readonly filterPayment = signal<PaymentMethod | 'all'>('all');

  // ── Detail state ──────────────────────────────────────────────────────────
  readonly selectedOrder = signal<AdminOrderDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly hasActiveFilters = computed(
    () =>
      !!this.filterDateFrom() ||
      !!this.filterDateTo() ||
      this.filterStatus() !== 'all' ||
      this.filterPayment() !== 'all',
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.loadOrders();
  }

  // ── Filter event handlers ─────────────────────────────────────────────────
  async onDateFromChange(value: string): Promise<void> {
    this.filterDateFrom.set(value);
    await this.loadOrders();
  }

  async onDateToChange(value: string): Promise<void> {
    this.filterDateTo.set(value);
    await this.loadOrders();
  }

  async onStatusChange(value: string): Promise<void> {
    this.filterStatus.set(value as OrderStatus | 'all');
    await this.loadOrders();
  }

  async onPaymentChange(value: string): Promise<void> {
    this.filterPayment.set(value as PaymentMethod | 'all');
    await this.loadOrders();
  }

  async clearFilters(): Promise<void> {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterStatus.set('all');
    this.filterPayment.set('all');
    await this.loadOrders();
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  async loadOrders(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.hasMore.set(false);
    try {
      const rows = await this.fetchOrders(0);
      this.orders.set(rows.slice(0, PAGE_SIZE));
      this.hasMore.set(rows.length > PAGE_SIZE);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    this.isLoadingMore.set(true);
    try {
      const offset = this.orders().length;
      const rows = await this.fetchOrders(offset);
      this.orders.update(prev => [...prev, ...rows.slice(0, PAGE_SIZE)]);
      this.hasMore.set(rows.length > PAGE_SIZE);
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  async openDetail(order: AdminOrderRow): Promise<void> {
    this.view.set('detail');
    this.detailLoading.set(true);
    this.detailError.set(false);
    this.selectedOrder.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('orders')
        .select(DETAIL_SELECT)
        .eq('id', order.id)
        .single();
      if (error) throw error;
      this.selectedOrder.set(data as unknown as AdminOrderDetail);
    } catch {
      this.detailError.set(true);
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail(): void {
    this.view.set('list');
    this.selectedOrder.set(null);
  }

  // ── Keyboard handler for table rows ──────────────────────────────────────
  onRowKeydown(event: KeyboardEvent, order: AdminOrderRow): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void this.openDetail(order);
    }
  }

  // ── Label helpers ─────────────────────────────────────────────────────────
  orderStatusLabel(status: string): string {
    return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
  }

  paymentMethodLabel(method: string): string {
    return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method;
  }

  paymentStatusLabel(status: string): string {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;
  }

  transactionStatusLabel(status: string): string {
    return TRANSACTION_STATUS_LABELS[status] ?? status;
  }

  // ── Format helpers ────────────────────────────────────────────────────────
  formatCurrency(amount: number): string {
    return '$' + new Intl.NumberFormat('es-AR').format(amount);
  }

  formatDate(timestamp: string): string {
    const d = new Date(timestamp);
    return (
      d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  formatDateShort(timestamp: string): string {
    const d = new Date(timestamp);
    return (
      d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  // ── Badge class helpers ───────────────────────────────────────────────────
  orderStatusBadgeClass(status: OrderStatus): string {
    const colorMap: Record<OrderStatus, string> = {
      pending:    'bg-warn-soft text-warn',
      confirmed:  'bg-accent-soft text-accent',
      preparing:  'bg-accent-soft text-accent',
      ready:      'bg-success-soft text-success',
      on_the_way: 'bg-accent-soft text-accent',
      delivered:  'bg-success-soft text-success',
      cancelled:  'bg-danger-soft text-danger',
      rejected:   'bg-orange-soft text-orange',
    };
    return `${BADGE_BASE} ${colorMap[status] ?? 'bg-border text-muted'}`;
  }

  paymentStatusBadgeClass(status: PaymentStatus): string {
    const colors = status === 'confirmed'
      ? 'bg-success-soft text-success'
      : 'bg-warn-soft text-warn';
    return `${BADGE_BASE} ${colors}`;
  }

  transactionStatusBadgeClass(status: string): string {
    const colorMap: Record<string, string> = {
      approved: 'bg-success-soft text-success',
      pending:  'bg-warn-soft text-warn',
      rejected: 'bg-danger-soft text-danger',
    };
    return `${BADGE_BASE} ${colorMap[status] ?? 'bg-border text-muted'}`;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/staff/admin']);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }

  // ── Private query builder ────────────────────────────────────────────────
  private async fetchOrders(offset: number): Promise<AdminOrderRow[]> {
    const dateFrom = this.filterDateFrom();
    const dateTo = this.filterDateTo();
    const status = this.filterStatus();
    const payment = this.filterPayment();

    // range(from, to) is inclusive on both ends; fetch PAGE_SIZE+1 to detect more pages
    let query = this.supabase.client
      .from('orders')
      .select(LIST_SELECT)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE);

    if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999`);
    if (status !== 'all') query = query.eq('order_status', status);
    if (payment !== 'all') query = query.eq('payment_method', payment);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as AdminOrderRow[];
  }
}
