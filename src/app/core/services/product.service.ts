import { Injectable, inject } from '@angular/core';
import { Product, Category, mockAllProducts } from '../mock-data';
import { SupabaseClientService } from '../supabase.client';

interface DbProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  is_combo: boolean;
  category_id: string;
  image_url: string | null;
}

interface DbCategory {
  id: string;
  name: string;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly mockProducts = mockAllProducts;

  // ── Mock-backed methods (used by ProductDetail, Cart) ─────────────────────

  getProductById(id: string): Product | null {
    return this.mockProducts.find(p => p.id === id) ?? null;
  }

  getActiveProducts(): Product[] {
    return this.mockProducts.filter(p => p.isActive);
  }

  // ── Supabase-backed methods ───────────────────────────────────────────────

  async loadCatalogProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('id, name, description, price, is_active, is_combo, category_id, image_url')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return (data as DbProduct[]).map(ProductService.mapProduct);
  }

  async loadFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('id, name, description, price, is_active, is_combo, category_id, image_url')
      .eq('is_active', true)
      .order('sort_order')
      .limit(3);

    if (error) throw error;
    return (data as DbProduct[]).map(ProductService.mapProduct);
  }

  async loadCatalogCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('id, name, description')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return (data as DbCategory[]).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
    }));
  }

  private static mapProduct(row: DbProduct): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      isActive: row.is_active,
      isCombo: row.is_combo,
      categoryId: row.category_id,
      imageUrl: row.image_url ?? undefined,
    };
  }
}
