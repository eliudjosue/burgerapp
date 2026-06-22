-- Row Level Security: policies for all tables.
-- Execute 002_schema.sql first (all tables must exist).
--
-- Idempotency note:
--   Functions (CREATE OR REPLACE) are safe to re-run.
--   ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent.
--   CREATE POLICY has no IF NOT EXISTS — re-running will fail with
--   "policy already exists". Drop the specific policy first if needed.

-- ─── ROLE HELPER ───────────────────────────────────────────────────────────
-- Returns the business role of the current authenticated user, or NULL.
-- Defined as SECURITY DEFINER so it bypasses RLS when called from within
-- policy USING clauses, preventing infinite recursion on the staff table.
CREATE OR REPLACE FUNCTION get_staff_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM staff WHERE id = auth.uid() AND is_active = true;
$$;

-- ─── ENABLE RLS ────────────────────────────────────────────────────────────
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY;

-- ─── CATEGORIES ────────────────────────────────────────────────────────────
-- Public: only active categories (inactive ones have no visible products).
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT TO anon
  USING (is_active = true);

-- Staff: full CRUD including inactive categories.
CREATE POLICY "categories_staff_all"
  ON categories FOR ALL TO authenticated
  USING (get_staff_role() IS NOT NULL)
  WITH CHECK (get_staff_role() IS NOT NULL);

-- ─── PRODUCTS ──────────────────────────────────────────────────────────────
-- Public: only active products — inactive ones are not shown, not "sold out"
-- (business.md §2.1).
CREATE POLICY "products_public_read"
  ON products FOR SELECT TO anon
  USING (is_active = true);

-- Staff: full CRUD including inactive products.
CREATE POLICY "products_staff_all"
  ON products FOR ALL TO authenticated
  USING (get_staff_role() IS NOT NULL)
  WITH CHECK (get_staff_role() IS NOT NULL);

-- ─── COMBO_ITEMS ───────────────────────────────────────────────────────────
-- Public: only rows where both the combo product and the component product are
-- active. Explicit double check — does not rely on products_public_read being
-- applied to the subqueries, so this policy is self-contained.
CREATE POLICY "combo_items_public_read"
  ON combo_items FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM products combo
      WHERE combo.id = combo_items.combo_id AND combo.is_active = true
    )
    AND EXISTS (
      SELECT 1 FROM products component
      WHERE component.id = combo_items.product_id AND component.is_active = true
    )
  );

CREATE POLICY "combo_items_staff_all"
  ON combo_items FOR ALL TO authenticated
  USING (get_staff_role() IS NOT NULL)
  WITH CHECK (get_staff_role() IS NOT NULL);

-- ─── DELIVERY_ZONES ────────────────────────────────────────────────────────
-- Public: only active zones shown in checkout dropdown.
CREATE POLICY "delivery_zones_public_read"
  ON delivery_zones FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "delivery_zones_staff_all"
  ON delivery_zones FOR ALL TO authenticated
  USING (get_staff_role() IS NOT NULL)
  WITH CHECK (get_staff_role() IS NOT NULL);

-- ─── SITE_SETTINGS ─────────────────────────────────────────────────────────
-- Public: always readable (logo, banner, hours, contact info).
CREATE POLICY "site_settings_public_read"
  ON site_settings FOR SELECT TO anon
  USING (true);

-- Admin only: update the single row. INSERT and DELETE are blocked for everyone
-- (the row is seeded once and never replaced).
CREATE POLICY "site_settings_admin_update"
  ON site_settings FOR UPDATE TO authenticated
  USING (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

-- ─── ORDERS ────────────────────────────────────────────────────────────────
-- Anon: submit a new order (no read).
CREATE POLICY "orders_anon_insert"
  ON orders FOR INSERT TO anon
  WITH CHECK (true);

-- Staff: read and update all orders (advance status, confirm payment).
CREATE POLICY "orders_staff_select"
  ON orders FOR SELECT TO authenticated
  USING (get_staff_role() IS NOT NULL);

CREATE POLICY "orders_staff_update"
  ON orders FOR UPDATE TO authenticated
  USING (get_staff_role() IS NOT NULL)
  WITH CHECK (get_staff_role() IS NOT NULL);

-- Anon has NO direct SELECT on orders.
-- Public order lookup (tracking) goes exclusively through the
-- get_order_for_tracking() RPC defined in 004_tracking_function.sql,
-- which enforces the order_number + customer_phone double match.

-- ─── ORDER_ITEMS ───────────────────────────────────────────────────────────
-- Anon: insert alongside the parent order.
CREATE POLICY "order_items_anon_insert"
  ON order_items FOR INSERT TO anon
  WITH CHECK (true);

-- Staff: read all items for all orders.
CREATE POLICY "order_items_staff_select"
  ON order_items FOR SELECT TO authenticated
  USING (get_staff_role() IS NOT NULL);

-- ─── PAYMENT_TRANSACTIONS ──────────────────────────────────────────────────
-- Anon: insert an initial transaction record when needed.
CREATE POLICY "payment_transactions_anon_insert"
  ON payment_transactions FOR INSERT TO anon
  WITH CHECK (true);

-- Staff: read and update (e.g., cashier confirms a manual transfer).
CREATE POLICY "payment_transactions_staff_select"
  ON payment_transactions FOR SELECT TO authenticated
  USING (get_staff_role() IS NOT NULL);

CREATE POLICY "payment_transactions_staff_update"
  ON payment_transactions FOR UPDATE TO authenticated
  USING (get_staff_role() IS NOT NULL)
  WITH CHECK (get_staff_role() IS NOT NULL);

-- ─── STAFF ─────────────────────────────────────────────────────────────────
-- Any authenticated user can read their own row (needed to resolve their role
-- on login). Uses a plain id comparison — no subquery, no recursion risk.
CREATE POLICY "staff_self_select"
  ON staff FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins can manage all staff records (create accounts, change roles, deactivate).
-- get_staff_role() is SECURITY DEFINER so it bypasses RLS on staff, avoiding
-- recursive policy evaluation.
CREATE POLICY "staff_admin_all"
  ON staff FOR ALL TO authenticated
  USING (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

-- ─── PENDING (Phase 2) ─────────────────────────────────────────────────────
-- Fine-grained per-role policies (kitchen/cashier/admin) are intentionally
-- deferred. Currently all staff share the same access level in the database.
-- Before going to production, add role-specific policies or filtered views so
-- that kitchen cannot read payment data, cashier cannot access reports, etc.
-- (business.md §2.5 / AGENTS.md §3).
