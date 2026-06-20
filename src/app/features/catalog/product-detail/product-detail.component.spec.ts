import { TestBed } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail.component';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { mockAllProducts } from '../../../core/mock-data';

describe('ProductDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([
          { path: 'product/:id', component: ProductDetailComponent }
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (param: string) => param === 'id' ? '1' : null
              }
            }
          }
        }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});