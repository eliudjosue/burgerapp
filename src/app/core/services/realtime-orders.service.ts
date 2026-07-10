import { Injectable, NgZone, inject } from '@angular/core';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SupabaseClientService } from '../supabase.client';

export interface NewOrderEvent {
  id: string;
  order_number: string;
  total: number;
}

type NewOrderCallback = (order: NewOrderEvent) => void;

const CHANNEL_NAME = 'staff-orders-realtime';

@Injectable({ providedIn: 'root' })
export class RealtimeOrdersService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly ngZone = inject(NgZone);

  private channel: RealtimeChannel | null = null;
  private callback: NewOrderCallback | null = null;
  private readonly seenIds = new Set<string>();

  subscribe(onNewOrder: NewOrderCallback): void {
    if (this.channel) return;

    this.callback = onNewOrder;
    this.channel = this.supabase.client
      .channel(CHANNEL_NAME)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          this.ngZone.run(() => this.handleInsert(payload));
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[RealtimeOrders] channel error — Supabase will retry automatically');
        }
      });
  }

  unsubscribe(): void {
    if (!this.channel) return;
    void this.supabase.client.removeChannel(this.channel);
    this.channel = null;
    this.callback = null;
    this.seenIds.clear();
  }

  private handleInsert(payload: RealtimePostgresChangesPayload<Record<string, unknown>>): void {
    if (payload.eventType !== 'INSERT') return;
    const row = payload.new as unknown as NewOrderEvent;
    if (!row?.id) return;
    if (this.seenIds.has(row.id)) return;
    this.seenIds.add(row.id);
    this.callback?.(row);
  }
}
