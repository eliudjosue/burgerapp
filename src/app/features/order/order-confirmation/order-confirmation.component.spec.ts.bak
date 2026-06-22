import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;
  let mockRouter: any;

  function setupRoute(queryParams: any) {
    return {
      provide: ActivatedRoute,
      useValue: {
        queryParams: {
          subscribe: (fn: (params: any) => void) => {
            fn(queryParams);
          }
        }
      }
    };
  }

  describe('when orderId is present', () => {
    beforeEach(async () => {
      mockRouter = {
        navigate: vi.fn()
      };

      await TestBed.configureTestingModule({
        imports: [OrderConfirmationComponent],
        providers: [
          setupRoute({ orderId: 'ABC123' }),
          {
            provide: Router,
            useValue: mockRouter
          }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OrderConfirmationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display the order ID from query params', () => {
      expect(component.orderId()).toBe('ABC123');
    });
  });

  describe('when orderId is missing', () => {
    beforeEach(async () => {
      mockRouter = {
        navigate: vi.fn()
      };

      await TestBed.configureTestingModule({
        imports: [OrderConfirmationComponent],
        providers: [
          setupRoute({}),
          {
            provide: Router,
            useValue: mockRouter
          }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OrderConfirmationComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should redirect to / when no orderId is provided', () => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});