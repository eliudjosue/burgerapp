import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import {
  AdminOrdersComponent,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  TRANSACTION_STATUS_LABELS,
} from './admin-orders.component';
import type {
  AdminOrderRow,
  AdminOrderDetail,
  OrderStatus,
  PaymentTransaction,
} from './admin-orders.component';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import type { StaffProfile } from '../../../../core/services/auth.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<AdminOrderRow> = {}): AdminOrderRow {
  return {
    id: 'ord-1',
    order_number: '#001',
    customer_name: 'Ana García',
    customer_phone: '1122334455',
    delivery_type: 'pickup',
    total: 5000,
    payment_method: 'cash',
    payment_status: 'pending_confirmation',
    order_status: 'pending',
    created_at: '2026-06-01T12:00:00Z',
    ...overrides,
  };
}

const MOCK_ORDERS: AdminOrderRow[] = [
  makeOrder({ id: 'ord-1', order_number: '#001' }),
  makeOrder({ id: 'ord-2', order_number: '#002', order_status: 'delivered' }),
  makeOrder({ id: 'ord-3', order_number: '#003', order_status: 'cancelled' }),
];

const MOCK_TRANSACTIONS: PaymentTransaction[] = [
  {
    provider: 'manual',
    provider_reference: 'REF-123',
    amount: 5000,
    status: 'approved',
    created_at: '2026-06-01T13:00:00Z',
  },
];

const MOCK_DETAIL: AdminOrderDetail = {
  ...makeOrder({ id: 'ord-1', order_number: '#001' }),
  address: 'Av. Siempre Viva 742',
  comments: 'Sin cebolla',
  subtotal: 4500,
  shipping_cost: 500,
  order_items: [
    { product_name: 'Hamburguesa Clásica', quantity: 1, product_price: 4500, line_total: 4500 },
  ],
  payment_transactions: MOCK_TRANSACTIONS,
};

// ── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(
  listResolve: unknown,
  detailResolve: unknown,
): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(detailResolve)),
    then: (
      onfulfilled?: (v: unknown) => unknown,
      onrejected?: (r: unknown) => unknown,
    ) => Promise.resolve(listResolve).then(onfulfilled, onrejected),
  };
  return chain;
}

class SupabaseClientServiceStub {
  fromListResolve: unknown = { data: MOCK_ORDERS, error: null };
  fromDetailResolve: unknown = { data: MOCK_DETAIL, error: null };

  client = {
    from: vi.fn().mockImplementation((_table: string) =>
      makeChain(this.fromListResolve, this.fromDetailResolve),
    ),
  };
}

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile>({ name: 'Admin Test', role: 'admin' });
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminOrdersComponent', () => {
  let supabaseStub: SupabaseClientServiceStub;

  beforeEach(async () => {
    supabaseStub = new SupabaseClientServiceStub();
    await TestBed.configureTestingModule({
      imports: [AdminOrdersComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseClientService, useValue: supabaseStub },
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminOrdersComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in list view', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    expect(c.view()).toBe('list');
  });

  it('should start with no active filters', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    expect(c.hasActiveFilters()).toBe(false);
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────

  it('should populate orders after successful init', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.orders()).toEqual(MOCK_ORDERS);
  });

  it('should set isLoading to false after successful init', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.isLoading()).toBe(false);
  });

  it('should set hasError when query fails', async () => {
    supabaseStub.fromListResolve = { data: null, error: { message: 'DB error' } };
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.hasError()).toBe(true);
  });

  it('should leave orders empty when query fails', async () => {
    supabaseStub.fromListResolve = { data: null, error: { message: 'DB error' } };
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.orders()).toHaveLength(0);
  });

  it('should set isLoading to false even when query fails', async () => {
    supabaseStub.fromListResolve = { data: null, error: { message: 'DB error' } };
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.isLoading()).toBe(false);
  });

  it('should set hasMore when result exceeds PAGE_SIZE', async () => {
    // 51 items → hasMore = true (PAGE_SIZE is 50, slice(0,50) + hasMore)
    const manyOrders = Array.from({ length: 51 }, (_, i) =>
      makeOrder({ id: `ord-${i}`, order_number: `#${i}` }),
    );
    supabaseStub.fromListResolve = { data: manyOrders, error: null };
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.hasMore()).toBe(true);
    expect(c.orders()).toHaveLength(50);
  });

  it('should not set hasMore when result is exactly PAGE_SIZE', async () => {
    const exactOrders = Array.from({ length: 50 }, (_, i) =>
      makeOrder({ id: `ord-${i}`, order_number: `#${i}` }),
    );
    supabaseStub.fromListResolve = { data: exactOrders, error: null };
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    expect(c.hasMore()).toBe(false);
  });

  // ── Filters ────────────────────────────────────────────────────────────────

  it('hasActiveFilters: true when dateFrom is set', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    c.filterDateFrom.set('2026-06-01');
    expect(c.hasActiveFilters()).toBe(true);
  });

  it('hasActiveFilters: true when dateTo is set', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    c.filterDateTo.set('2026-06-30');
    expect(c.hasActiveFilters()).toBe(true);
  });

  it('hasActiveFilters: true when status filter is active', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    c.filterStatus.set('cancelled');
    expect(c.hasActiveFilters()).toBe(true);
  });

  it('hasActiveFilters: true when payment filter is active', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    c.filterPayment.set('mercadopago');
    expect(c.hasActiveFilters()).toBe(true);
  });

  it('hasActiveFilters: false when all filters are default', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    expect(c.hasActiveFilters()).toBe(false);
  });

  it('onDateFromChange sets filterDateFrom and reloads', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.onDateFromChange('2026-06-01');
    expect(c.filterDateFrom()).toBe('2026-06-01');
    expect(c.orders()).toEqual(MOCK_ORDERS);
  });

  it('onDateToChange sets filterDateTo and reloads', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.onDateToChange('2026-06-30');
    expect(c.filterDateTo()).toBe('2026-06-30');
    expect(c.orders()).toEqual(MOCK_ORDERS);
  });

  it('onStatusChange sets filterStatus and reloads', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.onStatusChange('cancelled');
    expect(c.filterStatus()).toBe('cancelled');
    expect(c.orders()).toEqual(MOCK_ORDERS);
  });

  it('onPaymentChange sets filterPayment and reloads', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.onPaymentChange('mercadopago');
    expect(c.filterPayment()).toBe('mercadopago');
    expect(c.orders()).toEqual(MOCK_ORDERS);
  });

  it('clearFilters resets all filter signals', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    c.filterDateFrom.set('2026-06-01');
    c.filterDateTo.set('2026-06-30');
    c.filterStatus.set('delivered' as OrderStatus);
    c.filterPayment.set('transfer');
    await c.clearFilters();
    expect(c.filterDateFrom()).toBe('');
    expect(c.filterDateTo()).toBe('');
    expect(c.filterStatus()).toBe('all');
    expect(c.filterPayment()).toBe('all');
  });

  it('clearFilters triggers a reload', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    c.filterStatus.set('cancelled');
    await c.clearFilters();
    expect(c.orders()).toEqual(MOCK_ORDERS);
  });

  // ── loadMore ───────────────────────────────────────────────────────────────

  it('loadMore appends orders to existing list', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    const newOrder = makeOrder({ id: 'ord-4', order_number: '#004' });
    supabaseStub.fromListResolve = { data: [newOrder], error: null };
    await c.loadMore();
    expect(c.orders()).toHaveLength(MOCK_ORDERS.length + 1);
    expect(c.orders().some(o => o.id === 'ord-4')).toBe(true);
  });

  it('loadMore sets isLoadingMore to false after completion', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.loadMore();
    expect(c.isLoadingMore()).toBe(false);
  });

  it('loadMore sets hasMore to false when no further results', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    supabaseStub.fromListResolve = { data: [], error: null };
    await c.loadMore();
    expect(c.hasMore()).toBe(false);
  });

  // ── openDetail ─────────────────────────────────────────────────────────────

  it('openDetail switches to detail view', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.openDetail(MOCK_ORDERS[0]);
    expect(c.view()).toBe('detail');
  });

  it('openDetail loads and sets selectedOrder', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.openDetail(MOCK_ORDERS[0]);
    expect(c.selectedOrder()).toEqual(MOCK_DETAIL);
  });

  it('openDetail sets detailLoading to false after completion', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.openDetail(MOCK_ORDERS[0]);
    expect(c.detailLoading()).toBe(false);
  });

  it('openDetail sets detailError on failure', async () => {
    supabaseStub.fromDetailResolve = { data: null, error: { message: 'not found' } };
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.openDetail(MOCK_ORDERS[0]);
    expect(c.detailError()).toBe(true);
  });

  it('openDetail keeps selectedOrder null on failure', async () => {
    supabaseStub.fromDetailResolve = { data: null, error: { message: 'not found' } };
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.openDetail(MOCK_ORDERS[0]);
    expect(c.selectedOrder()).toBeNull();
  });

  // ── closeDetail ────────────────────────────────────────────────────────────

  it('closeDetail returns to list view', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.openDetail(MOCK_ORDERS[0]);
    c.closeDetail();
    expect(c.view()).toBe('list');
  });

  it('closeDetail clears selectedOrder', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    await c.openDetail(MOCK_ORDERS[0]);
    c.closeDetail();
    expect(c.selectedOrder()).toBeNull();
  });

  // ── onRowKeydown ───────────────────────────────────────────────────────────

  it('onRowKeydown opens detail on Enter', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    vi.spyOn(event, 'preventDefault');
    c.onRowKeydown(event, MOCK_ORDERS[0]);
    await Promise.resolve();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('onRowKeydown opens detail on Space', async () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    await c.ngOnInit();
    const event = new KeyboardEvent('keydown', { key: ' ' });
    vi.spyOn(event, 'preventDefault');
    c.onRowKeydown(event, MOCK_ORDERS[0]);
    await Promise.resolve();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('onRowKeydown does nothing on other keys', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    vi.spyOn(event, 'preventDefault');
    c.onRowKeydown(event, MOCK_ORDERS[0]);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // ── Label helpers ──────────────────────────────────────────────────────────

  it('orderStatusLabel returns correct labels', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).forEach(status => {
      expect(c.orderStatusLabel(status)).toBe(ORDER_STATUS_LABELS[status]);
    });
  });

  it('paymentMethodLabel returns correct labels', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    expect(c.paymentMethodLabel('cash')).toBe(PAYMENT_METHOD_LABELS.cash);
    expect(c.paymentMethodLabel('transfer')).toBe(PAYMENT_METHOD_LABELS.transfer);
    expect(c.paymentMethodLabel('mercadopago')).toBe(PAYMENT_METHOD_LABELS.mercadopago);
  });

  it('paymentStatusLabel returns correct labels', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    expect(c.paymentStatusLabel('pending_confirmation')).toBe(
      PAYMENT_STATUS_LABELS.pending_confirmation,
    );
    expect(c.paymentStatusLabel('confirmed')).toBe(PAYMENT_STATUS_LABELS.confirmed);
  });

  it('transactionStatusLabel returns correct labels', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    expect(c.transactionStatusLabel('approved')).toBe(TRANSACTION_STATUS_LABELS['approved']);
    expect(c.transactionStatusLabel('rejected')).toBe(TRANSACTION_STATUS_LABELS['rejected']);
    expect(c.transactionStatusLabel('pending')).toBe(TRANSACTION_STATUS_LABELS['pending']);
  });

  // ── Badge class helpers ────────────────────────────────────────────────────

  it('orderStatusBadgeClass: pending uses warn colors', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const cls = c.orderStatusBadgeClass('pending');
    expect(cls).toContain('bg-warn-soft');
    expect(cls).toContain('text-warn');
  });

  it('orderStatusBadgeClass: cancelled uses danger colors', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const cls = c.orderStatusBadgeClass('cancelled');
    expect(cls).toContain('bg-danger-soft');
    expect(cls).toContain('text-danger');
  });

  it('orderStatusBadgeClass: delivered uses success colors', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const cls = c.orderStatusBadgeClass('delivered');
    expect(cls).toContain('bg-success-soft');
    expect(cls).toContain('text-success');
  });

  it('paymentStatusBadgeClass: confirmed uses success colors', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const cls = c.paymentStatusBadgeClass('confirmed');
    expect(cls).toContain('bg-success-soft');
    expect(cls).toContain('text-success');
  });

  it('paymentStatusBadgeClass: pending_confirmation uses warn colors', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const cls = c.paymentStatusBadgeClass('pending_confirmation');
    expect(cls).toContain('bg-warn-soft');
    expect(cls).toContain('text-warn');
  });

  it('transactionStatusBadgeClass: approved uses success colors', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const cls = c.transactionStatusBadgeClass('approved');
    expect(cls).toContain('bg-success-soft');
    expect(cls).toContain('text-success');
  });

  // ── formatCurrency ─────────────────────────────────────────────────────────

  it('formatCurrency formats pesos with es-AR locale', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    const result = c.formatCurrency(15000);
    expect(result.startsWith('$')).toBe(true);
    expect(result).toContain('15');
    expect(result).toContain('000');
  });

  it('formatCurrency handles zero', () => {
    const c = TestBed.createComponent(AdminOrdersComponent).componentInstance;
    expect(c.formatCurrency(0)).toBe('$0');
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('goBack() navigates to /staff/admin', () => {
    const fixture = TestBed.createComponent(AdminOrdersComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/admin']);
  });

  it('logout() calls signOut and navigates to /staff/login', async () => {
    const fixture = TestBed.createComponent(AdminOrdersComponent);
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });
});
