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

interface KitchenOrderItem {
  product_name: string;
  quantity: number;
}

export interface KitchenOrder {
  id: string;
  order_number: string;
  delivery_type: 'pickup' | 'delivery';
  comments: string | null;
  created_at: string;
  order_status: 'confirmed' | 'preparing' | 'ready';
  order_items: KitchenOrderItem[];
}

const KITCHEN_STATUSES = ['confirmed', 'preparing', 'ready'] as const;
const KITCHEN_STATUS_SET = new Set<string>(KITCHEN_STATUSES);

type NextStatus = 'preparing' | 'ready';

@Component({
  selector: 'app-kitchen',
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
            class="flex items-center gap-1 text-white/50 hover:text-white text-xs cursor-pointer bg-transparent border-0 transition-colors"
            aria-label="Volver al panel"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Panel
          </button>
          <span class="font-semibold text-[15px] flex items-center gap-2">
            Cocina
            @if (activeCount() > 0) {
              <span
                class="bg-accent text-white px-1.5 py-px rounded-full font-mono text-[10px]"
              >{{ activeCount() }} activos</span>
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
            class="text-white/70 hover:text-white cursor-pointer bg-transparent border-0 p-0.5 leading-none ml-1"
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
            <span class="w-2 h-2 rounded-full bg-warn inline-block" aria-hidden="true"></span>
            Para preparar
            <span class="font-mono font-semibold text-sm">{{ confirmedOrders().length }}</span>
          </div>
          <div class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-surface border border-border text-xs font-medium whitespace-nowrap">
            <span class="w-2 h-2 rounded-full bg-accent inline-block" aria-hidden="true"></span>
            En preparación
            <span class="font-mono font-semibold text-sm">{{ preparingOrders().length }}</span>
          </div>
          <div class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-surface border border-border text-xs font-medium whitespace-nowrap">
            <span class="w-2 h-2 rounded-full bg-success inline-block" aria-hidden="true"></span>
            Listos hoy
            <span class="font-mono font-semibold text-sm">{{ readyOrders().length }}</span>
          </div>
        </div>
      </div>

      <!-- Board -->
      @if (loading()) {
        <div class="flex items-center justify-center h-48 text-muted text-sm px-3">
          Cargando pedidos…
        </div>
      } @else {
        <div
          class="flex gap-3 px-3 pb-6 overflow-x-auto"
          style="min-height: calc(100dvh - 110px); -webkit-overflow-scrolling: touch"
        >

          <!-- Column: Para preparar (confirmed) -->
          <div class="flex-1 min-w-[280px] max-w-[420px]" role="region" aria-label="Para preparar">
            <div
              class="flex items-center gap-2 px-2.5 py-2 mb-2 rounded-lg text-[13px] font-semibold"
              style="background: color-mix(in oklch, var(--color-warn) 14%, transparent); color: #8a6a0a"
            >
              <span class="w-2 h-2 rounded-full bg-warn inline-block" aria-hidden="true"></span>
              Para preparar
              <span class="font-mono text-[11px] font-normal opacity-70 ml-auto">
                {{ confirmedOrders().length }}
              </span>
            </div>

            @for (order of confirmedOrders(); track order.id) {
              <article
                class="bg-surface border border-border border-l-4 border-l-warn
                       rounded-lg px-3 py-2.5 mb-2 hover:shadow-sm transition-shadow"
                [attr.aria-label]="'Pedido ' + order.order_number"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-[17px] tracking-[-0.01em]">
                    {{ order.order_number }}
                  </span>
                  <span class="font-mono text-[10px] text-muted tabular-nums">
                    {{ timeAgo(order.created_at) }}
                  </span>
                </div>
                <p class="text-[11px] text-muted mb-1.5">
                  {{ order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro en local' }}
                </p>
                <ul class="text-[13px] leading-relaxed mb-2 list-none p-0 m-0">
                  @for (item of order.order_items; track item.product_name) {
                    <li class="flex gap-2 py-px">
                      <span class="font-mono text-muted min-w-[24px] shrink-0">×{{ item.quantity }}</span>
                      <span class="break-words min-w-0">{{ item.product_name }}</span>
                    </li>
                  }
                </ul>
                @if (order.comments) {
                  <p class="text-[11px] text-accent bg-accent-soft px-2 py-1 rounded mb-2 leading-snug">
                    {{ order.comments }}
                  </p>
                }
                <div class="mt-2">
                  <button
                    type="button"
                    (click)="advance(order)"
                    [disabled]="advancing() === order.id"
                    class="w-full py-2 rounded-lg text-xs font-semibold border-0
                           bg-accent text-white hover:opacity-90 active:scale-[0.97]
                           transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {{ advancing() === order.id ? 'Guardando…' : 'Iniciar preparación' }}
                  </button>
                </div>
              </article>
            }

            @if (confirmedOrders().length === 0) {
              <div class="flex flex-col items-center justify-center py-8 text-muted text-center gap-1.5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" class="opacity-25" aria-hidden="true">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-xs">Sin pedidos pendientes</p>
              </div>
            }
          </div>

          <!-- Column: En preparación (preparing) -->
          <div class="flex-1 min-w-[280px] max-w-[420px]" role="region" aria-label="En preparación">
            <div
              class="flex items-center gap-2 px-2.5 py-2 mb-2 rounded-lg text-[13px] font-semibold text-accent"
              style="background: color-mix(in oklch, var(--color-accent) 14%, transparent)"
            >
              <span class="w-2 h-2 rounded-full bg-accent inline-block" aria-hidden="true"></span>
              En preparación
              <span class="font-mono text-[11px] font-normal opacity-70 ml-auto">
                {{ preparingOrders().length }}
              </span>
            </div>

            @for (order of preparingOrders(); track order.id) {
              <article
                class="bg-surface border border-border border-l-4 border-l-accent
                       rounded-lg px-3 py-2.5 mb-2 hover:shadow-sm transition-shadow"
                [attr.aria-label]="'Pedido ' + order.order_number"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-[17px] tracking-[-0.01em]">
                    {{ order.order_number }}
                  </span>
                  <span class="font-mono text-[10px] text-muted tabular-nums">
                    {{ timeAgo(order.created_at) }}
                  </span>
                </div>
                <p class="text-[11px] text-muted mb-1.5">
                  {{ order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro en local' }}
                </p>
                <ul class="text-[13px] leading-relaxed mb-2 list-none p-0 m-0">
                  @for (item of order.order_items; track item.product_name) {
                    <li class="flex gap-2 py-px">
                      <span class="font-mono text-muted min-w-[24px] shrink-0">×{{ item.quantity }}</span>
                      <span class="break-words min-w-0">{{ item.product_name }}</span>
                    </li>
                  }
                </ul>
                @if (order.comments) {
                  <p class="text-[11px] text-accent bg-accent-soft px-2 py-1 rounded mb-2 leading-snug">
                    {{ order.comments }}
                  </p>
                }
                <div class="mt-2">
                  <button
                    type="button"
                    (click)="advance(order)"
                    [disabled]="advancing() === order.id"
                    class="w-full py-2 rounded-lg text-xs font-semibold border-0
                           bg-success text-white hover:opacity-90 active:scale-[0.97]
                           transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {{ advancing() === order.id ? 'Guardando…' : '✓ Marcar listo' }}
                  </button>
                </div>
              </article>
            }

            @if (preparingOrders().length === 0) {
              <div class="flex flex-col items-center justify-center py-8 text-muted text-center gap-1.5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" class="opacity-25" aria-hidden="true">
                  <path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
                </svg>
                <p class="text-xs">Nada en preparación</p>
              </div>
            }
          </div>

          <!-- Column: Listos para entregar (ready) -->
          <div class="flex-1 min-w-[280px] max-w-[420px]" role="region" aria-label="Listos para entregar">
            <div
              class="flex items-center gap-2 px-2.5 py-2 mb-2 rounded-lg text-[13px] font-semibold"
              style="background: color-mix(in oklch, var(--color-success) 14%, transparent); color: #0a6a3a"
            >
              <span class="w-2 h-2 rounded-full bg-success inline-block" aria-hidden="true"></span>
              Listos para entregar
              <span class="font-mono text-[11px] font-normal opacity-70 ml-auto">
                {{ readyOrders().length }}
              </span>
            </div>

            @for (order of readyOrders(); track order.id) {
              <article
                class="bg-surface border border-border border-l-4 border-l-success
                       rounded-lg px-3 py-2.5 mb-2 opacity-85"
                [attr.aria-label]="'Pedido ' + order.order_number + ' listo'"
              >
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-[17px] tracking-[-0.01em]">
                    {{ order.order_number }}
                  </span>
                  <span class="font-mono text-[10px] text-muted tabular-nums">
                    {{ timeAgo(order.created_at) }}
                  </span>
                </div>
                <p class="text-[11px] text-muted mb-1.5">
                  {{ order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro en local' }}
                </p>
                <ul class="text-[13px] leading-relaxed mb-2 list-none p-0 m-0">
                  @for (item of order.order_items; track item.product_name) {
                    <li class="flex gap-2 py-px">
                      <span class="font-mono text-muted min-w-[24px] shrink-0">×{{ item.quantity }}</span>
                      <span class="break-words min-w-0">{{ item.product_name }}</span>
                    </li>
                  }
                </ul>
                @if (order.comments) {
                  <p class="text-[11px] text-accent bg-accent-soft px-2 py-1 rounded mb-2 leading-snug">
                    {{ order.comments }}
                  </p>
                }
                <div class="flex justify-end mt-2">
                  <span class="text-[11px] text-success font-semibold">✓ Listo — avisar a caja</span>
                </div>
              </article>
            }

            @if (readyOrders().length === 0) {
              <div class="flex flex-col items-center justify-center py-8 text-muted text-center gap-1.5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" class="opacity-25" aria-hidden="true">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                <p class="text-xs">Sin pedidos listos</p>
              </div>
            }
          </div>

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
export class KitchenComponent implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  readonly orders = signal<KitchenOrder[]>([]);
  readonly loading = signal(true);
  readonly advancing = signal<string | null>(null);
  readonly newOrderAlert = signal<string | null>(null);
  readonly currentTime = signal('');

  readonly confirmedOrders = computed(() =>
    this.orders().filter(o => o.order_status === 'confirmed'),
  );
  readonly preparingOrders = computed(() =>
    this.orders().filter(o => o.order_status === 'preparing'),
  );
  readonly readyOrders = computed(() =>
    this.orders().filter(o => o.order_status === 'ready'),
  );
  readonly activeCount = computed(
    () => this.confirmedOrders().length + this.preparingOrders().length,
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

  async advance(order: KitchenOrder): Promise<void> {
    const nextStatus: NextStatus =
      order.order_status === 'confirmed' ? 'preparing' : 'ready';

    this.advancing.set(order.id);
    try {
      const { error } = await this.supabase.client.rpc('advance_order_status', {
        p_order_id: order.id,
        p_new_status: nextStatus,
      });

      if (!error) {
        this.orders.update(orders =>
          orders.map(o =>
            o.id === order.id ? { ...o, order_status: nextStatus } : o,
          ),
        );
      }
    } finally {
      this.advancing.set(null);
    }
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

  timeAgo(timestamp: string): string {
    const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000);
    if (mins < 1) return 'recién';
    if (mins === 1) return 'hace 1 min';
    return `hace ${mins} min`;
  }

  private async loadOrders(): Promise<void> {
    const { data } = await this.supabase.client
      .from('orders')
      .select(
        'id, order_number, delivery_type, comments, created_at, order_status, order_items(product_name, quantity)',
      )
      .in('order_status', [...KITCHEN_STATUSES])
      .order('created_at', { ascending: true });

    if (data) {
      this.orders.set(data as KitchenOrder[]);
    }
  }

  private subscribeRealtime(): void {
    this.channel = this.supabase.client
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Run inside Angular zone so OnPush change detection is triggered.
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

    if (KITCHEN_STATUS_SET.has(row.order_status)) {
      await this.loadSingleOrder(row.id);
      // Alert only when an order enters 'confirmed' — that's the actionable event for kitchen.
      if (row.order_status === 'confirmed') {
        this.showAlert(`Nuevo pedido ${row.order_number ?? ''}`);
      }
    } else {
      // Order moved beyond kitchen scope (delivered, on_the_way, cancelled, rejected…).
      this.orders.update(orders => orders.filter(o => o.id !== row.id));
    }
  }

  private async loadSingleOrder(orderId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('orders')
      .select(
        'id, order_number, delivery_type, comments, created_at, order_status, order_items(product_name, quantity)',
      )
      .eq('id', orderId)
      .single();

    if (!data) return;

    this.orders.update(orders => {
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        const updated = [...orders];
        updated[idx] = data as KitchenOrder;
        return updated;
      }
      // New order: insert and keep sorted oldest-first.
      return [...orders, data as KitchenOrder].sort(
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
