import { Routes } from '@angular/router';
import { HomeComponent } from './features/catalog/home/home.component';
import { Catalog } from './features/catalog/catalog.component';
import { CartComponent } from './features/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { OrderConfirmationComponent } from './features/order/order-confirmation/order-confirmation.component';
import { ProductDetailComponent } from './features/catalog/product-detail/product-detail.component';
import { ComingSoonComponent } from './shared/components/coming-soon/coming-soon.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'catalog', component: Catalog },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'order-confirmation', component: OrderConfirmationComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  // Temporary placeholder routes — replace with real implementations
  // (track: business.md section 2.1, staff/login: business.md section 2.5)
  { path: 'track', component: ComingSoonComponent },
  { path: 'staff/login', component: ComingSoonComponent },
  { path: '**', redirectTo: '' }
];