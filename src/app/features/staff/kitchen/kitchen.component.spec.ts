import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { KitchenComponent } from './kitchen.component';
import type { KitchenOrder } from './kitchen.component';
import { SupabaseClientService } from '../../../core/supabase.client';
import { AuthService } from '../../../core/services/auth.service';
import type { StaffProfile } from '../../../core/services/auth.service';

const MOCK_ORDERS: KitchenOrder[] = [
  {
    id: 'order-uuid-1',
    order_number: '#1035',
    delivery_type: 'delivery',
    comments: 'Sin cebolla',
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    order_status: 'confirmed',
    order_items: [
      { product_name: 'Hamburguesa Clásica', quantity: 2 },
      { product_name: 'Coca-Cola 500ml', quantity: 1 },
    ],
  },
  {
    id: 'order-uuid-2',
    order_number: '#1034',
    delivery_type: 'pickup',
    comments: null,
    created_at: new Date(Date.now() - 12 * 60_000).toISOString(),
    order_status: 'preparing',
    order_items: [{ product_name: 'Combo Clásico', quantity: 1 }],
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
  readonly staffProfile = signal<StaffProfile>({ name: 'Chef Test', role: 'kitchen' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

describe('KitchenComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [KitchenComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load orders on init', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.orders().length).toBe(MOCK_ORDERS.length);
  });

  it('should distribute orders into computed columns', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    const component = fixture.componentInstance;
    expect(component.confirmedOrders().length).toBe(1);
    expect(component.confirmedOrders()[0].id).toBe('order-uuid-1');
    expect(component.preparingOrders().length).toBe(1);
    expect(component.preparingOrders()[0].id).toBe('order-uuid-2');
    expect(component.readyOrders().length).toBe(0);
  });

  it('activeCount reflects confirmed + preparing only', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.activeCount()).toBe(2);
  });

  it('advance() calls advance_order_status RPC with confirmed → preparing', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    const confirmedOrder = fixture.componentInstance.confirmedOrders()[0];

    await fixture.componentInstance.advance(confirmedOrder);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('advance_order_status', {
      p_order_id: 'order-uuid-1',
      p_new_status: 'preparing',
    });
  });

  it('advance() calls advance_order_status RPC with preparing → ready', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    const preparingOrder = fixture.componentInstance.preparingOrders()[0];

    await fixture.componentInstance.advance(preparingOrder);

    expect(supabaseStub.client.rpc).toHaveBeenCalledWith('advance_order_status', {
      p_order_id: 'order-uuid-2',
      p_new_status: 'ready',
    });
  });

  it('advance() optimistically updates order status on success', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    const confirmedOrder = fixture.componentInstance.confirmedOrders()[0];

    await fixture.componentInstance.advance(confirmedOrder);

    const updated = fixture.componentInstance.orders().find(o => o.id === 'order-uuid-1');
    expect(updated?.order_status).toBe('preparing');
  });

  it('advance() does not update status when RPC returns an error', async () => {
    supabaseStub.client.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'invalid_transition' },
    });

    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    const confirmedOrder = fixture.componentInstance.confirmedOrders()[0];

    await fixture.componentInstance.advance(confirmedOrder);

    const unchanged = fixture.componentInstance.orders().find(o => o.id === 'order-uuid-1');
    expect(unchanged?.order_status).toBe('confirmed');
  });

  it('advance() clears advancing signal after RPC resolves', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    const confirmedOrder = fixture.componentInstance.confirmedOrders()[0];

    await fixture.componentInstance.advance(confirmedOrder);

    expect(fixture.componentInstance.advancing()).toBeNull();
  });

  it('timeAgo() returns "recién" for a very recent timestamp', () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    const now = new Date().toISOString();
    expect(fixture.componentInstance.timeAgo(now)).toBe('recién');
  });

  it('timeAgo() returns "hace 1 min" for a 1-minute-old timestamp', () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    const oneMinAgo = new Date(Date.now() - 65_000).toISOString();
    expect(fixture.componentInstance.timeAgo(oneMinAgo)).toBe('hace 1 min');
  });

  it('timeAgo() returns "hace N min" for older timestamps', () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(fixture.componentInstance.timeAgo(fiveMinAgo)).toBe('hace 5 min');
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });

  it('ngOnDestroy() removes the realtime channel', async () => {
    const fixture = TestBed.createComponent(KitchenComponent);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.ngOnDestroy();
    expect(supabaseStub.client.removeChannel).toHaveBeenCalled();
  });
});
