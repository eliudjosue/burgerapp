import { Routes } from '@angular/router';
import { HomeComponent } from './features/catalog/home/home.component';
import { Catalog } from './features/catalog/catalog.component';
import { CartComponent } from './features/cart/cart.component';
import { ProductDetailComponent } from './features/catalog/product-detail/product-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'catalog', component: Catalog },
  { path: 'product/:id', component: ProductDetailComponent, title: 'Detalle de Producto' },
  { path: 'cart', component: CartComponent },
  { path: '**', redirectTo: '' }
];