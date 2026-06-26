import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase.client';

export interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
}

export interface OrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  deliveryType: 'pickup' | 'delivery';
  address?: string;
  deliveryZoneId?: string;
  comments?: string;
  paymentMethod: 'cash' | 'transfer' | 'mercadopago';
  items: OrderItemPayload[];
}

export interface TrackedOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  deliveryType: string;
  createdAt: string;
  updatedAt: string;
}

interface DbDeliveryZone {
  id: string;
  name: string;
  cost: number;
}

interface DbTrackedOrder {
  id: string;
  order_number: string;
  order_status: string;
  delivery_type: string;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly supabase = inject(SupabaseClientService);

  async loadDeliveryZones(): Promise<DeliveryZone[]> {
    const { data, error } = await this.supabase.client
      .from('delivery_zones')
      .select('id, name, cost')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return (data as DbDeliveryZone[]).map(row => ({
      id: row.id,
      name: row.name,
      cost: Number(row.cost),
    }));
  }

  async trackOrder(orderNumber: string, phone: string): Promise<TrackedOrder | null> {
    const { data, error } = await this.supabase.client.rpc('get_order_for_tracking', {
      p_order_number: orderNumber,
      p_phone: phone,
    });
    if (error) throw error;
    const rows = data as DbTrackedOrder[] | null;
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      orderNumber: row.order_number,
      orderStatus: row.order_status,
      deliveryType: row.delivery_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createOrder(payload: CreateOrderPayload): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('create_order', {
      p_customer_name:    payload.customerName,
      p_customer_phone:   payload.customerPhone,
      p_delivery_type:    payload.deliveryType,
      p_address:          payload.address ?? '',
      p_delivery_zone_id: payload.deliveryZoneId ?? '',
      p_comments:         payload.comments ?? '',
      p_payment_method:   payload.paymentMethod,
      p_items: payload.items.map(item => ({
        product_id: item.productId,
        quantity:   item.quantity,
      })),
    });

    if (error) throw error;
    return data as string;
  }
}
