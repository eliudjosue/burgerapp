import { Injectable, inject } from '@angular/core';
import { Product } from '../mock-data';
import { mockAllProducts } from '../mock-data';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly mockProducts = mockAllProducts;

  getProductById(id: string): Product | null {
    return this.mockProducts.find(p => p.id === id) || null;
  }

  getActiveProducts(): Product[] {
    return this.mockProducts.filter(p => p.isActive);
  }
}