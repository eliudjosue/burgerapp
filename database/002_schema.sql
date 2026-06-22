-- Full database schema: all 9 tables in dependency order.
-- Execute 001_helpers.sql first.
-- Tables use CREATE TABLE IF NOT EXISTS, so this script is safe to re-run.

-- ─── CATEGORIES ────────────────────────────────────────────────────────────
-- Text PK (e.g. 'hamburguesas', 'combos') mirrors the semantic IDs used in
-- the frontend and keeps foreign keys human-readable.
CREATE TABLE IF NOT EXISTS categories (
  id          text          PRIMARY KEY,
  name        text          NOT NULL,
  description text,
  sort_order  int           NOT NULL DEFAULT 0,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── PRODUCTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text          NOT NULL,
  description text          NOT NULL,
  price       numeric(10,2) NOT NULL,
  is_active   boolean       NOT NULL DEFAULT true,
  is_combo    boolean       NOT NULL DEFAULT false,
  category_id text          NOT NULL REFERENCES categories(id),
  image_url   text,
  sort_order  int           NOT NULL DEFAULT 0,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── COMBO_ITEMS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS combo_items (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id    uuid          NOT NULL REFERENCES products(id),
  product_id  uuid          NOT NULL REFERENCES products(id),
  quantity    int           NOT NULL DEFAULT 1,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT no_self_reference CHECK (combo_id <> product_id)
);

CREATE TRIGGER combo_items_updated_at
  BEFORE UPDATE ON combo_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── DELIVERY_ZONES ────────────────────────────────────────────────────────
-- Text PK (e.g. 'centro', 'norte') for the same reason as categories.
CREATE TABLE IF NOT EXISTS delivery_zones (
  id          text          PRIMARY KEY,
  name        text          NOT NULL,
  cost        numeric(10,2) NOT NULL,
  is_active   boolean       NOT NULL DEFAULT true,
  sort_order  int           NOT NULL DEFAULT 0,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER delivery_zones_updated_at
  BEFORE UPDATE ON delivery_zones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ORDERS ────────────────────────────────────────────────────────────────
-- order_status and payment_status are always independent (business.md §2.3).
-- delivery_zone_id uses ON DELETE SET NULL to preserve historical order data
-- if a zone is later removed.
CREATE TABLE IF NOT EXISTS orders (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     text          UNIQUE NOT NULL DEFAULT generate_order_number(),
  customer_name    text          NOT NULL,
  customer_phone   text          NOT NULL,
  delivery_type    text          NOT NULL
                                 CHECK (delivery_type IN ('pickup', 'delivery')),
  address          text,
  delivery_zone_id text          REFERENCES delivery_zones(id) ON DELETE SET NULL,
  comments         text,
  payment_method   text          NOT NULL
                                 CHECK (payment_method IN ('cash', 'transfer', 'mercadopago')),
  order_status     text          NOT NULL DEFAULT 'pending'
                                 CHECK (order_status IN (
                                   'pending', 'confirmed', 'preparing',
                                   'ready', 'on_the_way', 'delivered', 'cancelled'
                                 )),
  payment_status   text          NOT NULL DEFAULT 'pending_confirmation'
                                 CHECK (payment_status IN ('pending_confirmation', 'confirmed')),
  subtotal         numeric(10,2) NOT NULL,
  shipping_cost    numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ORDER_ITEMS ───────────────────────────────────────────────────────────
-- product_name and product_price are snapshots: they preserve the price and name
-- at the time of the order, unaffected by future product edits.
-- product_id uses ON DELETE SET NULL so the snapshot survives product deletion.
CREATE TABLE IF NOT EXISTS order_items (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid          REFERENCES products(id) ON DELETE SET NULL,
  product_name  text          NOT NULL,
  product_price numeric(10,2) NOT NULL,
  quantity      int           NOT NULL,
  line_total    numeric(10,2) GENERATED ALWAYS AS (product_price * quantity) STORED,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── PAYMENT_TRANSACTIONS ──────────────────────────────────────────────────
-- Separate from orders to support MP retries without touching the order record.
-- The latest row with status = 'approved' is the canonical payment confirmation.
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid          NOT NULL REFERENCES orders(id),
  provider           text          NOT NULL
                                   CHECK (provider IN ('mercadopago', 'manual')),
  provider_reference text,
  amount             numeric(10,2) NOT NULL,
  status             text          NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── STAFF ─────────────────────────────────────────────────────────────────
-- Auth (login/session) is handled by Supabase Auth.
-- This table holds the business role (kitchen/cashier/admin) and is the
-- authoritative source for permission checks — not the JWT alone.
CREATE TABLE IF NOT EXISTS staff (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  role       text        NOT NULL
                         CHECK (role IN ('kitchen', 'cashier', 'admin')),
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── SITE_SETTINGS ─────────────────────────────────────────────────────────
-- Single-row table enforced by CHECK (id = 1) and the seeded INSERT below.
-- All content here is editable by admin from the panel without touching code
-- (business.md §2.6).
CREATE TABLE IF NOT EXISTS site_settings (
  id                   int         PRIMARY KEY DEFAULT 1,
  business_hours       text,
  whatsapp_number      text,
  logo_url             text,
  banner_image_url     text,
  banner_title         text,
  banner_subtitle      text,
  banner_button_text   text,
  banner_button_link   text,
  bank_transfer_alias  text,
  bank_transfer_cbu    text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed the single row so it always exists to SELECT from.
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
