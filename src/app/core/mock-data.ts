/**
 * Mock data for the burgerapp frontend
 * 
 * NOTE: This file contains mock data that will be replaced with real Supabase calls
 * once the database schema is defined and applied. All field names are in English
 * as per the project conventions, but the actual content shown to users remains in Spanish.
 */

export interface BannerData {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  categoryId: string;
  imageUrl?: string;
}

export interface SiteSettings {
  businessHours: string;
  whatsappNumber: string;
  logoUrl?: string;
  bannerImageUrl?: string;
}

// Mock data for featured products
export const mockFeaturedProducts: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Clásica',
    description: 'Pan artesanal, carne 100% vacuna, lechuga, tomate, cebolla y salsa especial',
    price: 1200,
    isActive: true,
    categoryId: 'hamburguesas'
  },
  {
    id: '2',
    name: 'Combo Familiar',
    description: 'Hamburguesa clásica + 2 papas fritas + 2 bebidas',
    price: 2800,
    isActive: true,
    categoryId: 'combos'
  },
  {
    id: '3',
    name: 'Postre Especial',
    description: 'Helado de vainilla con salsa de caramelo',
    price: 600,
    isActive: true,
    categoryId: 'postres'
  }
];

// Mock data for categories
export const mockCategories: Category[] = [
  {
    id: 'hamburguesas',
    name: 'Hamburguesas'
  },
  {
    id: 'combos',
    name: 'Combos'
  },
  {
    id: 'bebidas',
    name: 'Bebidas'
  },
  {
    id: 'postres',
    name: 'Postres'
  }
];

// Mock data for site settings
export const mockSiteSettings: SiteSettings = {
  businessHours: 'Lunes a Domingo 11:00 - 22:00',
  whatsappNumber: 'XXXXXXXXXXX' // Esto se reemplazará con el número real
};

// Mock data for banner
export const mockBannerData: BannerData = {
  imageUrl: '',
  title: '¡Hamburguesas Artesanales!',
  subtitle: 'Preparadas con ingredientes de primera calidad. Pedido online y entrega a domicilio.',
  buttonText: 'Ver Catálogo',
  buttonLink: '/catalog'
};