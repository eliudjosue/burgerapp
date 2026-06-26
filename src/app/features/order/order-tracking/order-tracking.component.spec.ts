import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderTrackingComponent } from './order-tracking.component';
import { OrderService } from '../../../core/services/order.service';
import type { TrackedOrder } from '../../../core/services/order.service';

const MOCK_PICKUP_ORDER: TrackedOrder = {
  id: 'order-uuid-1',
  orderNumber: 'BH-0001',
  orderStatus: 'preparing',
  deliveryType: 'pickup',
  createdAt: '2024-01-01T12:00:00Z',
  updatedAt: '2024-01-01T12:05:00Z',
};

const MOCK_DELIVERY_ORDER: TrackedOrder = {
  id: 'order-uuid-2',
  orderNumber: 'BH-0002',
  orderStatus: 'on_the_way',
  deliveryType: 'delivery',
  createdAt: '2024-01-01T13:00:00Z',
  updatedAt: '2024-01-01T13:20:00Z',
};

class OrderServiceStub {
  trackOrder = vi.fn((): Promise<TrackedOrder | null> => Promise.resolve(null));
}

describe('OrderTrackingComponent', () => {
  let orderStub: OrderServiceStub;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [OrderTrackingComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useClass: OrderServiceStub },
      ],
    }).compileComponents();

    orderStub = TestBed.inject(OrderService) as unknown as OrderServiceStub;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(OrderTrackingComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('localStorage shortcut', () => {
    it('should set lastOrder from valid localStorage entry on init', () => {
      localStorage.setItem(
        'last_order',
        JSON.stringify({ orderNumber: 'BH-0099', phone: '1134567890' }),
      );
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.lastOrder()).toEqual({
        orderNumber: 'BH-0099',
        phone: '1134567890',
      });
    });

    it('should not set lastOrder when localStorage is empty', () => {
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.lastOrder()).toBeNull();
    });

    it('should not set lastOrder when localStorage value is invalid JSON', () => {
      localStorage.setItem('last_order', 'not-json');
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.lastOrder()).toBeNull();
    });

    it('should not set lastOrder when stored object is missing required fields', () => {
      localStorage.setItem('last_order', JSON.stringify({ orderNumber: 'BH-0099' }));
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.lastOrder()).toBeNull();
    });
  });

  describe('onSearch()', () => {
    it('should not call trackOrder when form is invalid', async () => {
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      await component.onSearch();

      expect(orderStub.trackOrder).not.toHaveBeenCalled();
    });

    it('should set orderResult when trackOrder returns an order', async () => {
      orderStub.trackOrder.mockResolvedValue(MOCK_PICKUP_ORDER);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0001', phone: '1134567890' });
      await component.onSearch();

      expect(component.orderResult()).toEqual(MOCK_PICKUP_ORDER);
      expect(component.notFound()).toBe(false);
      expect(component.searchError()).toBeNull();
    });

    it('should set notFound when trackOrder returns null', async () => {
      orderStub.trackOrder.mockResolvedValue(null);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'WRONG', phone: '0000000000' });
      await component.onSearch();

      expect(component.notFound()).toBe(true);
      expect(component.orderResult()).toBeNull();
    });

    it('should set searchError when trackOrder throws', async () => {
      orderStub.trackOrder.mockRejectedValue(new Error('Network'));
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0001', phone: '1134567890' });
      await component.onSearch();

      expect(component.searchError()).toBeTruthy();
      expect(component.notFound()).toBe(false);
      expect(component.orderResult()).toBeNull();
    });

    it('should reset previous results before each new search', async () => {
      orderStub.trackOrder.mockResolvedValueOnce(MOCK_PICKUP_ORDER).mockResolvedValueOnce(null);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0001', phone: '1134567890' });
      await component.onSearch();
      expect(component.orderResult()).not.toBeNull();

      component.searchForm.setValue({ orderNumber: 'WRONG', phone: '0000000000' });
      await component.onSearch();
      expect(component.orderResult()).toBeNull();
      expect(component.notFound()).toBe(true);
    });

    it('should set searching to false after completion', async () => {
      orderStub.trackOrder.mockResolvedValue(MOCK_PICKUP_ORDER);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0001', phone: '1134567890' });
      await component.onSearch();

      expect(component.searching()).toBe(false);
    });
  });

  describe('trackLastOrder()', () => {
    it('should fill the form and trigger search with saved values', async () => {
      orderStub.trackOrder.mockResolvedValue(MOCK_PICKUP_ORDER);
      localStorage.setItem(
        'last_order',
        JSON.stringify({ orderNumber: 'BH-0001', phone: '1134567890' }),
      );

      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      await component.trackLastOrder();

      expect(component.searchForm.value).toEqual({
        orderNumber: 'BH-0001',
        phone: '1134567890',
      });
      expect(orderStub.trackOrder).toHaveBeenCalledWith('BH-0001', '1134567890');
      expect(component.orderResult()).toEqual(MOCK_PICKUP_ORDER);
    });

    it('should do nothing when lastOrder is null', async () => {
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      await component.trackLastOrder();

      expect(orderStub.trackOrder).not.toHaveBeenCalled();
    });
  });

  describe('timelineSteps()', () => {
    it('should return 5 steps for pickup order', async () => {
      orderStub.trackOrder.mockResolvedValue(MOCK_PICKUP_ORDER);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0001', phone: '1134567890' });
      await component.onSearch();

      expect(component.timelineSteps().length).toBe(5);
    });

    it('should return 6 steps for delivery order (includes on_the_way)', async () => {
      orderStub.trackOrder.mockResolvedValue(MOCK_DELIVERY_ORDER);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0002', phone: '1134567890' });
      await component.onSearch();

      expect(component.timelineSteps().length).toBe(6);
      expect(component.timelineSteps().some(s => s.status === 'on_the_way')).toBe(true);
    });

    it('should mark earlier steps as done and current step as active for pickup', async () => {
      // status = 'preparing' → index 2; pending(0) and confirmed(1) are done
      orderStub.trackOrder.mockResolvedValue(MOCK_PICKUP_ORDER);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0001', phone: '1134567890' });
      await component.onSearch();

      const steps = component.timelineSteps();
      expect(steps[0].state).toBe('done');   // pending
      expect(steps[1].state).toBe('done');   // confirmed
      expect(steps[2].state).toBe('active'); // preparing
      expect(steps[3].state).toBe('pending'); // ready
      expect(steps[4].state).toBe('pending'); // delivered
    });

    it('should mark all steps as pending for cancelled order', async () => {
      const cancelledOrder: TrackedOrder = { ...MOCK_PICKUP_ORDER, orderStatus: 'cancelled' };
      orderStub.trackOrder.mockResolvedValue(cancelledOrder);
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      const component = fixture.componentInstance;
      component.ngOnInit();

      component.searchForm.setValue({ orderNumber: 'BH-0001', phone: '1134567890' });
      await component.onSearch();

      expect(component.timelineSteps().every(s => s.state === 'pending')).toBe(true);
    });

    it('should return empty array when no order is loaded', () => {
      const fixture = TestBed.createComponent(OrderTrackingComponent);
      fixture.componentInstance.ngOnInit();
      expect(fixture.componentInstance.timelineSteps()).toEqual([]);
    });
  });
});
