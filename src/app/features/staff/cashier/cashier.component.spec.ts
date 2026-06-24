import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { CashierComponent } from './cashier.component';
import type { CashierOrder } from './cashier.component';
import { SupabaseClientService } from '../../../core/supabase.client';
import { AuthService } from '../../../core/services/auth.service';
import type { StaffProfile } from '../../../core/services/auth.service';

const now = Date.now();

const MOCK_ORDERS: CashierOrder[] = [
  {
    id: 'order-pending-transfer',
    order_number: '#1040',
    customer_name: 'María García',
    customer_phone: '11 9876-5432',
    address: 'Av. Corrientes 1234',
    delivery_type: 'delivery',
    comments: null,
    payment_method: 'transfer',
    payment_status: 'pending_confirmation',
    order_status: 'pending',
    subtotal: 4500,
    shipping_cost: 500,
    total: 5000,
    created_at: new Date(now - 2 * 60_000).toISOString(),
    order_items: [
      { product_name: 'Hamburguesa Clásica', quantity: 1, product_price: 3000, line_total: 3000 },
      { product_name: 'Papas con Cheddar', quantity: 1, product_price: 1500, line_total: 1500 },
    ],
  },
  {
    id: 'order-preparing-transfer',
    order_number: '#1035',
    customer_name: 'Juan Pérez',
    customer_phone: '11 2345-6789',
    address: null,
    delivery_type: 'pickup',
    comments: null,
    payment_method: 'transfer',
    payment_status: 'pending_confirmation',
    order_status: 'preparing',
    subtotal: 6000,
    shipping_cost: 0,
    total: 6000,
    created_at: new Date(now - 15 * 60_000).toISOString(),
    order_items: [
      { product_name: 'Combo Clásico', quantity: 2, product_price: 3000, line_total: 6000 },
    ],
  },
  {
    id: 'order-ready-delivery',
    order_number: '#1033',
    customer_name: 'Ana López',
    customer_phone: '11 3333-4444',
    address: 'Av. Santa Fe 567',
    delivery_type: 'delivery',
    comments: null,
    payment_method: 'cash',
    payment_status: 'pending_confirmation',
    order_status: 'ready',
    subtotal: 3500,
    shipping_cost: 600,
    total: 4100,
    created_at: new Date(now - 25 * 60_000).toISOString(),
    order_items: [
      { product_name: 'Veggie Burger', quantity: 1, product_price: 3500, line_total: 3500 },
    ],
  },
  {
    id: 'order-ready-pickup',
    order_number: '#1032',
    customer_name: 'Luis Martínez',
    customer_phone: '11 5555-6666',
    address: null,
    delivery_type: 'pickup',
    comments: null,
    payment_method: 'cash',
    payment_status: 'pending_confirmation',
    order_status: 'ready',
    subtotal: 2500,
    shipping_cost: 0,
    total: 2500,
    created_at: new Date(now - 30 * 60_000).toISOString(),
    order_items: [
      { product_name: 'Hamburguesa Simple', quantity: 1, product_price: 2500, line_total: 2500 },
    ],
  },
  {
    id: 'order-on-way',
    order_number: '#1030',
    customer_name: 'Pedro Suárez',
    customer_phone: '11 7777-8888',
    address: 'Av. Callao 999',
    delivery_type: 'delivery',
    comments: null,
    payment_method: 'mercadopago',
    payment_status: 'confirmed',
    order_status: 'on_the_way',
    subtotal: 4000,
    shipping_cost: 800,
    total: 4800,
    created_at: new Date(now - 45 * 60_000).toISOString(),
    order_items: [
      { product_name: 'Combo Doble', quantity: 1, product_price: 4000, line_total: 4000 },
    ],
  },
];

class SupabaseClientServiceStub {
  private readonly channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  private readonly queryChain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: MOCK_ORDERS, error: null }),
    single: vi.fn().mockResolvedValue({ data: MOCK_ORDERS[0], error: null }),
  };

  client = {
    from: vi.fn().mockReturnValue(this.queryChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnValue(this.channelMock),
    removeChannel: vi.fn().mockResolvedValue('ok'),
  };
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Cajero Test', role: 'cashier' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

describe('CashierComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [CashierComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load all orders on init', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.orders().length).toBe(MOCK_ORDERS.length);
  });

  it('should separate pending and active orders via computed signals', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const component = fixture.componentInstance;

    expect(component.pendingOrders().length).toBe(1);
    expect(component.pendingOrders()[0].id).toBe('order-pending-transfer');

    expect(component.activeOrders().length).toBe(4);
    expect(component.activeOrders().every(o => o.order_status !== 'pending')).toBe(true);
  });

  it('confirmOrder() calls advance_order_status with pending → confirmed', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const pendingOrder = fixture.componentInstance.pendingOrders()[0];

    await fixture.componentInstance.confirmOrder(pendingOrder);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('advance_order_status', {
      p_order_id: 'order-pending-transfer',
      p_new_status: 'confirmed',
    });
  });

  it('confirmOrder() optimistically updates order_status to confirmed', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const pendingOrder = fixture.componentInstance.pendingOrders()[0];

    await fixture.componentInstance.confirmOrder(pendingOrder);

    const updated = fixture.componentInstance.orders().find(o => o.id === 'order-pending-transfer');
    expect(updated?.order_status).toBe('confirmed');
  });

  it('confirmOrder() does not update status when RPC returns error', async () => {
    supabaseStub.client.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'invalid_transition' },
    });

    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const pendingOrder = fixture.componentInstance.pendingOrders()[0];

    await fixture.componentInstance.confirmOrder(pendingOrder);

    const unchanged = fixture.componentInstance.orders().find(o => o.id === 'order-pending-transfer');
    expect(unchanged?.order_status).toBe('pending');
  });

  it('confirmOrder() clears confirmingOrder signal after completion', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const pendingOrder = fixture.componentInstance.pendingOrders()[0];

    await fixture.componentInstance.confirmOrder(pendingOrder);

    expect(fixture.componentInstance.confirmingOrder()).toBeNull();
  });

  it('advanceDelivery() for ready delivery order calls with ready → on_the_way', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const readyDelivery = fixture.componentInstance.orders().find(o => o.id === 'order-ready-delivery')!;

    await fixture.componentInstance.advanceDelivery(readyDelivery);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('advance_order_status', {
      p_order_id: 'order-ready-delivery',
      p_new_status: 'on_the_way',
    });
  });

  it('advanceDelivery() for ready pickup order calls with ready → delivered', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const readyPickup = fixture.componentInstance.orders().find(o => o.id === 'order-ready-pickup')!;

    await fixture.componentInstance.advanceDelivery(readyPickup);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('advance_order_status', {
      p_order_id: 'order-ready-pickup',
      p_new_status: 'delivered',
    });
  });

  it('advanceDelivery() for on_the_way order calls with on_the_way → delivered', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const onWay = fixture.componentInstance.orders().find(o => o.id === 'order-on-way')!;

    await fixture.componentInstance.advanceDelivery(onWay);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('advance_order_status', {
      p_order_id: 'order-on-way',
      p_new_status: 'delivered',
    });
  });

  it('advanceDelivery() optimistically updates order_status', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const readyDelivery = fixture.componentInstance.orders().find(o => o.id === 'order-ready-delivery')!;

    await fixture.componentInstance.advanceDelivery(readyDelivery);

    const updated = fixture.componentInstance.orders().find(o => o.id === 'order-ready-delivery');
    expect(updated?.order_status).toBe('on_the_way');
  });

  it('advanceDelivery() clears advancing signal after completion', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const readyDelivery = fixture.componentInstance.orders().find(o => o.id === 'order-ready-delivery')!;

    await fixture.componentInstance.advanceDelivery(readyDelivery);

    expect(fixture.componentInstance.advancing()).toBeNull();
  });

  it('submitPaymentConfirm() calls confirm_manual_payment RPC with reference', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const transferOrder = fixture.componentInstance.orders().find(o => o.id === 'order-preparing-transfer')!;

    fixture.componentInstance.openPaymentConfirm(transferOrder);
    fixture.componentInstance.paymentNote.set('9876543210');

    await fixture.componentInstance.submitPaymentConfirm(transferOrder);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('confirm_manual_payment', {
      p_order_id: 'order-preparing-transfer',
      p_reference: '9876543210',
    });
  });

  it('submitPaymentConfirm() sends null reference when note is empty', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const transferOrder = fixture.componentInstance.orders().find(o => o.id === 'order-preparing-transfer')!;

    fixture.componentInstance.openPaymentConfirm(transferOrder);
    fixture.componentInstance.paymentNote.set('');

    await fixture.componentInstance.submitPaymentConfirm(transferOrder);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('confirm_manual_payment', {
      p_order_id: 'order-preparing-transfer',
      p_reference: null,
    });
  });

  it('submitPaymentConfirm() optimistically updates payment_status to confirmed', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const transferOrder = fixture.componentInstance.orders().find(o => o.id === 'order-preparing-transfer')!;

    fixture.componentInstance.openPaymentConfirm(transferOrder);
    await fixture.componentInstance.submitPaymentConfirm(transferOrder);

    const updated = fixture.componentInstance.orders().find(o => o.id === 'order-preparing-transfer');
    expect(updated?.payment_status).toBe('confirmed');
  });

  it('submitPaymentConfirm() collapses the form on success', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const transferOrder = fixture.componentInstance.orders().find(o => o.id === 'order-preparing-transfer')!;

    fixture.componentInstance.openPaymentConfirm(transferOrder);
    expect(fixture.componentInstance.expandedPaymentOrderId()).toBe('order-preparing-transfer');

    await fixture.componentInstance.submitPaymentConfirm(transferOrder);

    expect(fixture.componentInstance.expandedPaymentOrderId()).toBeNull();
  });

  it('submitPaymentConfirm() does not update status when RPC returns error', async () => {
    supabaseStub.client.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'payment_already_confirmed' },
    });

    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    const transferOrder = fixture.componentInstance.orders().find(o => o.id === 'order-preparing-transfer')!;

    fixture.componentInstance.openPaymentConfirm(transferOrder);
    await fixture.componentInstance.submitPaymentConfirm(transferOrder);

    const unchanged = fixture.componentInstance.orders().find(o => o.id === 'order-preparing-transfer');
    expect(unchanged?.payment_status).toBe('pending_confirmation');
  });

  it('needsPaymentConfirm() returns true for transfer + pending_confirmation', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const order = MOCK_ORDERS.find(o => o.id === 'order-preparing-transfer')!;
    expect(fixture.componentInstance.needsPaymentConfirm(order)).toBe(true);
  });

  it('needsPaymentConfirm() returns false for cash payment', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const cashOrder = MOCK_ORDERS.find(o => o.payment_method === 'cash')!;
    expect(fixture.componentInstance.needsPaymentConfirm(cashOrder)).toBe(false);
  });

  it('needsPaymentConfirm() returns false when payment already confirmed', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const paidOrder = MOCK_ORDERS.find(o => o.payment_status === 'confirmed')!;
    expect(fixture.componentInstance.needsPaymentConfirm(paidOrder)).toBe(false);
  });

  it('deliveryNextStatus() returns on_the_way for ready delivery order', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const order = MOCK_ORDERS.find(o => o.id === 'order-ready-delivery')!;
    expect(fixture.componentInstance.deliveryNextStatus(order)).toBe('on_the_way');
  });

  it('deliveryNextStatus() returns delivered for ready pickup order', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const order = MOCK_ORDERS.find(o => o.id === 'order-ready-pickup')!;
    expect(fixture.componentInstance.deliveryNextStatus(order)).toBe('delivered');
  });

  it('deliveryNextStatus() returns delivered for on_the_way order', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const order = MOCK_ORDERS.find(o => o.id === 'order-on-way')!;
    expect(fixture.componentInstance.deliveryNextStatus(order)).toBe('delivered');
  });

  it('deliveryNextStatus() returns null for confirmed/preparing orders', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const order = MOCK_ORDERS.find(o => o.id === 'order-preparing-transfer')!;
    expect(fixture.componentInstance.deliveryNextStatus(order)).toBeNull();
  });

  it('cancelPaymentConfirm() collapses form and resets note', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const order = MOCK_ORDERS[0];

    fixture.componentInstance.openPaymentConfirm(order);
    fixture.componentInstance.paymentNote.set('some-ref');
    fixture.componentInstance.cancelPaymentConfirm();

    expect(fixture.componentInstance.expandedPaymentOrderId()).toBeNull();
    expect(fixture.componentInstance.paymentNote()).toBe('');
  });

  it('timeAgo() returns "recién" for a very recent timestamp', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    expect(fixture.componentInstance.timeAgo(new Date().toISOString())).toBe('recién');
  });

  it('timeAgo() returns "hace 1 min" for a 1-minute-old timestamp', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const oneMinAgo = new Date(Date.now() - 65_000).toISOString();
    expect(fixture.componentInstance.timeAgo(oneMinAgo)).toBe('hace 1 min');
  });

  it('timeAgo() returns "hace N min" for older timestamps', () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(fixture.componentInstance.timeAgo(fiveMinAgo)).toBe('hace 5 min');
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });

  it('ngOnDestroy() removes the realtime channel', async () => {
    const fixture = TestBed.createComponent(CashierComponent);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.ngOnDestroy();
    expect(supabaseStub.client.removeChannel).toHaveBeenCalled();
  });
});
