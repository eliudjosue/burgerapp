import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { CheckoutComponent } from './checkout.component';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import type { DeliveryZone, CreateOrderPayload } from '../../core/services/order.service';
import type { CartItem } from '../../core/services/cart.service';
import type { Product } from '../../core/mock-data';

const MOCK_PRODUCT: Product = {
  id: 'b1000000-0000-0000-0000-000000000001',
  name: 'Hamburguesa Clásica',
  description: 'Pan, carne, lechuga, tomate, cebolla, queso',
  price: 1200,
  isActive: true,
  categoryId: 'hamburguesas',
};

const MOCK_ZONES: DeliveryZone[] = [
  { id: 'centro', name: 'Centro', cost: 500 },
  { id: 'norte', name: 'Barrio Norte', cost: 800 },
];

class CartServiceStub {
  readonly items = signal<CartItem[]>([]);
  readonly isEmpty = signal(true);
  readonly total = signal(0);
  clearCart = vi.fn();

  setItems(cartItems: CartItem[]): void {
    this.items.set(cartItems);
    this.isEmpty.set(cartItems.length === 0);
    this.total.set(cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0));
  }
}

class OrderServiceStub {
  loadDeliveryZones = (): Promise<DeliveryZone[]> => Promise.resolve([]);
  createOrder = (_: CreateOrderPayload): Promise<string> => Promise.resolve('');
}

describe('CheckoutComponent', () => {
  let cartStub: CartServiceStub;
  let orderStub: OrderServiceStub;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useClass: CartServiceStub },
        { provide: OrderService, useClass: OrderServiceStub },
      ],
    }).compileComponents();

    cartStub = TestBed.inject(CartService) as unknown as CartServiceStub;
    orderStub = TestBed.inject(OrderService) as unknown as OrderServiceStub;
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with zonesLoading true before ngOnInit', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    expect(fixture.componentInstance.zonesLoading()).toBe(true);
  });

  it('should load zones and set zonesLoading to false on success', async () => {
    orderStub.loadDeliveryZones = () => Promise.resolve(MOCK_ZONES);
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.zones().length).toBe(2);
    expect(component.zones()[0].id).toBe('centro');
    expect(component.zonesLoading()).toBe(false);
  });

  it('should set zonesLoading to false even when zone load fails', async () => {
    orderStub.loadDeliveryZones = () => Promise.reject(new Error('Network error'));
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.zonesLoading()).toBe(false);
    expect(component.zones().length).toBe(0);
  });

  it('should default to pickup with zero shipping cost', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    expect(component.formData.deliveryType).toBe('pickup');
    expect(component.shippingCost()).toBe(0);
  });

  it('should update shipping cost when a delivery zone is selected', async () => {
    orderStub.loadDeliveryZones = () => Promise.resolve(MOCK_ZONES);
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();
    component.onDeliveryTypeChange('delivery');
    component.onDeliveryZoneChange('norte');

    expect(component.shippingCost()).toBe(800);
  });

  it('should reset shipping cost to 0 when switching back to pickup', async () => {
    orderStub.loadDeliveryZones = () => Promise.resolve(MOCK_ZONES);
    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();
    component.onDeliveryTypeChange('delivery');
    component.onDeliveryZoneChange('centro');
    component.onDeliveryTypeChange('pickup');

    expect(component.shippingCost()).toBe(0);
  });

  it('should call createOrder and navigate to order-confirmation on success', async () => {
    orderStub.loadDeliveryZones = () => Promise.resolve(MOCK_ZONES);
    orderStub.createOrder = vi.fn(() => Promise.resolve('ABC123')) as unknown as (_: CreateOrderPayload) => Promise<string>;
    cartStub.setItems([{ product: MOCK_PRODUCT, quantity: 2 }]);

    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.ngOnInit();
    component.formData.customerName = 'Juan';
    component.formData.phone = '1134567890';
    component.formData.deliveryType = 'pickup';
    component.formData.paymentMethod = 'cash';

    await component.onSubmit();

    expect(orderStub.createOrder).toHaveBeenCalled();
    expect(cartStub.clearCart).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/order-confirmation'],
      { queryParams: { orderNumber: 'ABC123' } }
    );
  });

  it('should set submitError and not navigate when createOrder throws', async () => {
    orderStub.createOrder = () => Promise.reject(new Error('DB error'));
    cartStub.setItems([{ product: MOCK_PRODUCT, quantity: 1 }]);

    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.ngOnInit();
    component.formData.customerName = 'Juan';
    component.formData.phone = '1134567890';

    await component.onSubmit();

    expect(component.submitError()).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should leave submitting false after submit completes', async () => {
    orderStub.createOrder = () => Promise.resolve('XYZ789');
    cartStub.setItems([{ product: MOCK_PRODUCT, quantity: 1 }]);

    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.ngOnInit();
    component.formData.customerName = 'Juan';
    component.formData.phone = '1134567890';

    await component.onSubmit();

    expect(component.submitting()).toBe(false);
  });

  it('should save last_order to localStorage with orderNumber and phone on success', async () => {
    orderStub.createOrder = vi.fn(() => Promise.resolve('ABC123')) as unknown as (_: CreateOrderPayload) => Promise<string>;
    cartStub.setItems([{ product: MOCK_PRODUCT, quantity: 1 }]);

    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.ngOnInit();
    component.formData.customerName = 'Juan';
    component.formData.phone = '1134567890';

    await component.onSubmit();

    const stored = localStorage.getItem('last_order');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toEqual({ orderNumber: 'ABC123', phone: '1134567890' });
  });

  it('should not save last_order to localStorage when createOrder throws', async () => {
    orderStub.createOrder = () => Promise.reject(new Error('DB error'));
    cartStub.setItems([{ product: MOCK_PRODUCT, quantity: 1 }]);

    const fixture = TestBed.createComponent(CheckoutComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.ngOnInit();
    component.formData.customerName = 'Juan';
    component.formData.phone = '1134567890';

    await component.onSubmit();

    expect(localStorage.getItem('last_order')).toBeNull();
  });
});
