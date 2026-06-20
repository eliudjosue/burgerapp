import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have mock data available', () => {
    expect(component.mockBannerData).toBeDefined();
    expect(component.mockCategories).toBeDefined();
    expect(component.mockFeaturedProducts).toBeDefined();
    expect(component.mockSiteSettings).toBeDefined();
  });

  it('should render banner data correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(component.mockBannerData.title);
    expect(compiled.querySelector('p')?.textContent).toContain(component.mockBannerData.subtitle);
  });
});