import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { ActivatedRoute, Router } from '@angular/router';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  function setupRoute(queryParams: Record<string, string>) {
    return {
      provide: ActivatedRoute,
      useValue: {
        queryParams: {
          subscribe: (fn: (params: Record<string, string>) => void) => {
            fn(queryParams);
          }
        }
      }
    };
  }

  describe('when orderNumber is present', () => {
    beforeEach(async () => {
      mockRouter = { navigate: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [OrderConfirmationComponent],
        providers: [
          setupRoute({ orderNumber: 'ABC123' }),
          { provide: Router, useValue: mockRouter }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OrderConfirmationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display the order number from query params', () => {
      expect(component.orderNumber()).toBe('ABC123');
    });
  });

  describe('when orderNumber is missing', () => {
    beforeEach(async () => {
      mockRouter = { navigate: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [OrderConfirmationComponent],
        providers: [
          setupRoute({}),
          { provide: Router, useValue: mockRouter }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OrderConfirmationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should redirect to / when no orderNumber is provided', () => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('whatsappUrl()', () => {
    beforeEach(async () => {
      mockRouter = { navigate: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [OrderConfirmationComponent],
        providers: [
          setupRoute({ orderNumber: 'BH-0042' }),
          { provide: Router, useValue: mockRouter }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OrderConfirmationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should generate a wa.me URL containing the order number', () => {
      const url = component.whatsappUrl();
      expect(url).toContain('wa.me');
      expect(url).toContain('BH-0042');
    });

    it('should include a pre-filled text message with the order number', () => {
      const url = component.whatsappUrl();
      expect(decodeURIComponent(url)).toContain('#BH-0042');
    });

    it('should not include a hard-coded phone number in the WhatsApp URL', () => {
      const url = component.whatsappUrl();
      // wa.me/<number>?text=... would include digits between wa.me/ and ?
      // wa.me/?text=... has no number — verify path segment is empty
      const afterWame = url.split('wa.me/')[1] ?? '';
      expect(afterWame.startsWith('?')).toBe(true);
    });
  });
});
