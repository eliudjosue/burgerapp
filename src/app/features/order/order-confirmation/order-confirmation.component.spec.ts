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
});
