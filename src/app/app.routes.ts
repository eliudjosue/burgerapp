import { Routes } from '@angular/router';
import { HomeComponent } from './features/catalog/home/home.component';
import { Catalog } from './features/catalog/catalog.component';
import { CartComponent } from './features/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { OrderConfirmationComponent } from './features/order/order-confirmation/order-confirmation.component';
import { ProductDetailComponent } from './features/catalog/product-detail/product-detail.component';
import { OrderTrackingComponent } from './features/order/order-tracking/order-tracking.component';
import { StaffLoginComponent } from './features/staff/login/staff-login.component';
import { StaffDashboardComponent } from './features/staff/staff-dashboard.component';
import { KitchenComponent } from './features/staff/kitchen/kitchen.component';
import { CashierComponent } from './features/staff/cashier/cashier.component';
import { AdminDashboardComponent } from './features/staff/admin/dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './features/staff/admin/products/admin-products.component';
import { AdminCategoriesComponent } from './features/staff/admin/categories/admin-categories.component';
import { AdminDeliveryZonesComponent } from './features/staff/admin/delivery-zones/admin-delivery-zones.component';
import { AdminSiteSettingsComponent } from './features/staff/admin/site-settings/admin-site-settings.component';
import { AdminUsersComponent } from './features/staff/admin/users/admin-users.component';
import { AdminOrdersComponent } from './features/staff/admin/orders/admin-orders.component';
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
  { path: 'track', component: OrderTrackingComponent },
  { path: 'staff/login', component: StaffLoginComponent },
  { path: 'staff', component: StaffDashboardComponent, canActivate: [authGuard] },
  { path: 'staff/kitchen', component: KitchenComponent, canActivate: [roleGuard(['kitchen', 'admin'])] },
  { path: 'staff/cashier', component: CashierComponent, canActivate: [roleGuard(['cashier', 'admin'])] },
  { path: 'staff/admin', component: AdminDashboardComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'staff/admin/products', component: AdminProductsComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'staff/admin/categories', component: AdminCategoriesComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'staff/admin/delivery-zones', component: AdminDeliveryZonesComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'staff/admin/settings', component: AdminSiteSettingsComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'staff/admin/users', component: AdminUsersComponent, canActivate: [roleGuard(['admin'])] },
  { path: 'staff/admin/orders', component: AdminOrdersComponent, canActivate: [roleGuard(['admin'])] },
  { path: '**', redirectTo: '' },
];