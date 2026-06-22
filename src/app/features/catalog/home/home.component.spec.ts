import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { ProductService } from '../../../core/services/product.service';
import { SiteSettingsService } from '../../../core/services/site-settings.service';
import type { SiteSettingsData } from '../../../core/services/site-settings.service';
import type { Product } from '../../../core/mock-data';

const MOCK_SETTINGS: SiteSettingsData = {
  businessHours: 'Lunes a Domingo 11:00 - 22:00',
  whatsappNumber: '5491112345678',
  logoUrl: null,
  bannerImageUrl: null,
  bannerTitle: '¡Hamburguesas Artesanales!',
  bannerSubtitle: 'Las mejores hamburguesas.',
  bannerButtonText: 'Ver Catálogo',
  bannerButtonLink: '/catalog',
  bankTransferAlias: null,
  bankTransferCbu: null,
};

const MOCK_FEATURED: Product[] = [
  {
    id: 'uuid-ham-1',
    name: 'Hamburguesa Clásica',
    description: 'Pan, carne, lechuga',
    price: 1200,
    isActive: true,
    categoryId: 'hamburguesas',
  },
  {
    id: 'uuid-ham-2',
    name: 'Hamburguesa Doble',
    description: 'Pan, 2 carnes',
    price: 1800,
    isActive: true,
    categoryId: 'hamburguesas',
  },
];

class ProductServiceStub {
  loadFeaturedProducts = (): Promise<Product[]> => Promise.resolve(MOCK_FEATURED);
  loadCatalogProducts = (): Promise<Product[]> => Promise.resolve([]);
  loadCatalogCategories = (): Promise<never[]> => Promise.resolve([]);
  getProductById = (_id: string): null => null;
  getActiveProducts = (): Product[] => MOCK_FEATURED;
}

class SiteSettingsServiceStub {
  getSettings = (): Promise<SiteSettingsData> => Promise.resolve(MOCK_SETTINGS);
}

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: ProductService, useClass: ProductServiceStub },
        { provide: SiteSettingsService, useClass: SiteSettingsServiceStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in loading state', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    expect(component.isLoading()).toBe(true);
    expect(component.hasError()).toBe(false);
  });

  it('should load settings and featured products', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.isLoading()).toBe(false);
    expect(component.hasError()).toBe(false);
    expect(component.settings()).toEqual(MOCK_SETTINGS);
    expect(component.featuredProducts().length).toBe(MOCK_FEATURED.length);
  });

  it('should expose banner title from settings', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component.settings()?.bannerTitle).toBe(MOCK_SETTINGS.bannerTitle);
  });

  it('should set error state and clear loading when a service throws', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;

    const stub = TestBed.inject(SiteSettingsService) as unknown as SiteSettingsServiceStub;
    stub.getSettings = () => Promise.reject(new Error('Network error'));

    await component.ngOnInit();

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });
});
