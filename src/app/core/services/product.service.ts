import { Injectable, inject } from '@angular/core';
import { Product, Category, ComboItem, mockAllProducts } from '../mock-data';
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

interface DbComboItemRow {
  product_id: string;
  quantity: number;
  products: { name: string } | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly mockProducts = mockAllProducts;

  // ── Mock-backed methods ───────────────────────────────────────────────────

  getActiveProducts(): Product[] {
    return this.mockProducts.filter(p => p.isActive);
  }

  // ── Supabase-backed methods ───────────────────────────────────────────────

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('id, name, description, price, is_active, is_combo, category_id, image_url')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    const row = data as DbProduct | null;
    if (!row || !row.is_active) return null;
    return ProductService.mapProduct(row);
  }

  // Single query with join to avoid N+1. RLS already filters inactive components.
  async getComboItemsWithNames(comboId: string): Promise<ComboItem[]> {
    const { data, error } = await this.supabase.client
      .from('combo_items')
      .select('product_id, quantity, products!product_id(name)')
      .eq('combo_id', comboId);

    if (error) throw error;
    return (data as unknown as DbComboItemRow[]).map(row => ({
      productId: row.product_id,
      quantity: row.quantity,
      name: row.products?.name ?? '',
    }));
  }

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
