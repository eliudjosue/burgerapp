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
  imageUrl?: string;
}

export interface ComboItem {
  productId: string;
  quantity: number;
  name?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  categoryId: string;
  imageUrl?: string;
  isCombo?: boolean;
  comboItems?: ComboItem[];
}

export interface SiteSettings {
  businessHours: string;
  whatsappNumber: string;
  logoUrl?: string;
  bannerImageUrl?: string;
}

// Mock data for categories
export const mockCategories: Category[] = [
  {
    id: 'hamburguesas',
    name: 'Hamburguesas',
    description: 'Hamburguesas de la casa'
  },
  {
    id: 'acompañamientos',
    name: 'Acompañamientos',
    description: 'Acompañamientos y accesorios'
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    description: 'Bebidas y refrescos'
  },
  {
    id: 'combos',
    name: 'Combos',
    description: 'Combos especiales'
  }
];

// Full product catalog (used by the catalog screen)
export const mockAllProducts: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Clásica',
    description: 'Pan, carne, lechuga, tomate, cebolla, queso',
    price: 1200,
    isActive: true,
    categoryId: 'hamburguesas',
    imageUrl: 'https://placehold.co/600x400?text=Hamburguesa+Clasica'
  },
  {
    id: '2',
    name: 'Hamburguesa Doble',
    description: 'Pan, 2 carnes, lechuga, tomate, cebolla, queso',
    price: 1800,
    isActive: true,
    categoryId: 'hamburguesas',
    imageUrl: 'https://placehold.co/600x400?text=Hamburguesa+Doble'
  },
  {
    id: '3',
    name: 'Hamburguesa Veggie',
    description: 'Pan, hinojo, lechuga, tomate, cebolla, queso vegano',
    price: 1400,
    isActive: true,
    categoryId: 'hamburguesas',
    imageUrl: 'https://placehold.co/600x400?text=Hamburguesa+Veggie'
  },
  {
    id: '4',
    name: 'Papas Fritas',
    description: 'Papas fritas crujientes',
    price: 800,
    isActive: false,
    categoryId: 'acompañamientos',
    imageUrl: 'https://placehold.co/600x400?text=Papas+Fritas'
  },
  {
    id: '5',
    name: 'Papas al Ajo',
    description: 'Papas fritas con ajo y hierbas',
    price: 900,
    isActive: true,
    categoryId: 'acompañamientos',
    imageUrl: 'https://placehold.co/600x400?text=Papas+al+Ajo'
  },
  {
    id: '6',
    name: 'Agua Mineral',
    description: 'Botella de agua mineral',
    price: 500,
    isActive: true,
    categoryId: 'bebidas',
    imageUrl: 'https://placehold.co/600x400?text=Agua+Mineral'
  },
  {
    id: '7',
    name: 'Coca Cola',
    description: 'Botella de Coca-Cola 1L',
    price: 700,
    isActive: true,
    categoryId: 'bebidas',
    imageUrl: 'https://placehold.co/600x400?text=Coca+Cola'
  },
  {
    id: '8',
    name: 'Combo Familiar',
    description: 'Hamburguesa doble + papas + bebida',
    price: 2800,
    isActive: true,
    categoryId: 'combos',
    imageUrl: 'https://placehold.co/600x400?text=Combo+Familiar',
    isCombo: true,
    comboItems: [
      { productId: '2', quantity: 1 },
      { productId: '5', quantity: 1 },
      { productId: '7', quantity: 1 }
    ]
  },
  {
    id: '9',
    name: 'Combo Vegetariano',
    description: 'Hamburguesa veggie + papas + bebida',
    price: 2100,
    isActive: true,
    categoryId: 'combos',
    imageUrl: 'https://placehold.co/600x400?text=Combo+Vegetariano',
    isCombo: true,
    comboItems: [
      { productId: '3', quantity: 1 },
      { productId: '5', quantity: 1 },
      { productId: '7', quantity: 1 }
    ]
  }
];

// Subset used by the Home screen ("featured products")
export const mockFeaturedProducts: Product[] = mockAllProducts.filter((p) =>
  ['1', '8', '9'].includes(p.id)
);

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