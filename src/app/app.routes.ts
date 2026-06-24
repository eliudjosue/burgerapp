import { Routes } from '@angular/router';
import { HomeComponent } from './features/catalog/home/home.component';
import { Catalog } from './features/catalog/catalog.component';
import { CartComponent } from './features/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { OrderConfirmationComponent } from './features/order/order-confirmation/order-confirmation.component';
import { ProductDetailComponent } from './features/catalog/product-detail/product-detail.component';
import { ComingSoonComponent } from './shared/components/coming-soon/coming-soon.component';
import { StaffLoginComponent } from './features/staff/login/staff-login.component';
import { StaffDashboardComponent } from './features/staff/staff-dashboard.component';
import { KitchenComponent } from './features/staff/kitchen/kitchen.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'catalog', component: Catalog },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'order-confirmation', component: OrderConfirmationComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  // Temporary placeholder — replace with real tracking screen (business.md section 2.1)
  { path: 'track', component: ComingSoonComponent },
  { path: 'staff/login', component: StaffLoginComponent },
  { path: 'staff', component: StaffDashboardComponent, canActivate: [authGuard] },
  { path: 'staff/kitchen', component: KitchenComponent, canActivate: [roleGuard(['kitchen', 'admin'])] },
  { path: '**', redirectTo: '' },
];