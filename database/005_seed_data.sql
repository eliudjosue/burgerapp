-- Seed initial catalog data mirroring the frontend mock-data.ts.
-- Idempotent: skips gracefully if the products table is not empty.
-- Execute via Supabase dashboard → SQL Editor.
-- NOTE: category IDs and product UUIDs are fixed so this file is auditable
--       and combo_items can reference products by a stable ID.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    RAISE NOTICE 'Seed skipped: products table is not empty.';
    RETURN;
  END IF;

  -- ─── CATEGORIES ────────────────────────────────────────────────────────────
  INSERT INTO categories (id, name, description, sort_order, is_active) VALUES
    ('hamburguesas',    'Hamburguesas',    'Hamburguesas de la casa',      1, true),
    ('acompañamientos', 'Acompañamientos', 'Acompañamientos y accesorios', 2, true),
    ('bebidas',         'Bebidas',         'Bebidas y refrescos',           3, true),
    ('combos',          'Combos',          'Combos especiales',             4, true);

  -- ─── PRODUCTS ──────────────────────────────────────────────────────────────
  -- Fixed UUIDs (b1…001 – b1…009) keep the seed idempotent and tie combo_items
  -- to the right rows without a second SELECT.
  INSERT INTO products
    (id, name, description, price, is_active, is_combo, category_id, image_url, sort_order)
  VALUES
    (
      'b1000000-0000-0000-0000-000000000001',
      'Hamburguesa Clásica',
      'Pan, carne, lechuga, tomate, cebolla, queso',
      1200.00, true, false, 'hamburguesas',
      'https://placehold.co/600x400?text=Hamburguesa+Clasica', 1
    ),
    (
      'b1000000-0000-0000-0000-000000000002',
      'Hamburguesa Doble',
      'Pan, 2 carnes, lechuga, tomate, cebolla, queso',
      1800.00, true, false, 'hamburguesas',
      'https://placehold.co/600x400?text=Hamburguesa+Doble', 2
    ),
    (
      'b1000000-0000-0000-0000-000000000003',
      'Hamburguesa Veggie',
      'Pan, hinojo, lechuga, tomate, cebolla, queso vegano',
      1400.00, true, false, 'hamburguesas',
      'https://placehold.co/600x400?text=Hamburguesa+Veggie', 3
    ),
    (
      'b1000000-0000-0000-0000-000000000004',
      'Papas Fritas',
      'Papas fritas crujientes',
      800.00, false, false, 'acompañamientos',
      'https://placehold.co/600x400?text=Papas+Fritas', 1
    ),
    (
      'b1000000-0000-0000-0000-000000000005',
      'Papas al Ajo',
      'Papas fritas con ajo y hierbas',
      900.00, true, false, 'acompañamientos',
      'https://placehold.co/600x400?text=Papas+al+Ajo', 2
    ),
    (
      'b1000000-0000-0000-0000-000000000006',
      'Agua Mineral',
      'Botella de agua mineral',
      500.00, true, false, 'bebidas',
      'https://placehold.co/600x400?text=Agua+Mineral', 1
    ),
    (
      'b1000000-0000-0000-0000-000000000007',
      'Coca Cola',
      'Botella de Coca-Cola 1L',
      700.00, true, false, 'bebidas',
      'https://placehold.co/600x400?text=Coca+Cola', 2
    ),
    (
      'b1000000-0000-0000-0000-000000000008',
      'Combo Familiar',
      'Hamburguesa doble + papas + bebida',
      2800.00, true, true, 'combos',
      'https://placehold.co/600x400?text=Combo+Familiar', 1
    ),
    (
      'b1000000-0000-0000-0000-000000000009',
      'Combo Vegetariano',
      'Hamburguesa veggie + papas + bebida',
      2100.00, true, true, 'combos',
      'https://placehold.co/600x400?text=Combo+Vegetariano', 2
    );

  -- ─── COMBO ITEMS ───────────────────────────────────────────────────────────
  -- Combo Familiar (008): Hamburguesa Doble (002) + Papas al Ajo (005) + Coca Cola (007)
  -- Combo Vegetariano (009): Hamburguesa Veggie (003) + Papas al Ajo (005) + Coca Cola (007)
  INSERT INTO combo_items (combo_id, product_id, quantity) VALUES
    ('b1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002', 1),
    ('b1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000005', 1),
    ('b1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000007', 1),
    ('b1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003', 1),
    ('b1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000005', 1),
    ('b1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000007', 1);

END $$;
