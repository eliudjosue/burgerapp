-- 009_products_admin_rls.sql
-- Tighten write access on products and combo_items to admin-only.
--
-- Previously both tables had FOR ALL for any active staff member (IS NOT NULL).
-- business.md §4: role permissions must be enforced at the data level, not just
-- in the frontend guard — a cashier JWT must not be able to modify the catalog.
--
-- Split: all staff can SELECT; only admin can INSERT/UPDATE/DELETE.
-- The public read policies (anon, active-only) are untouched.
--
-- Idempotency: uses DROP POLICY IF EXISTS + CREATE POLICY. Safe to re-run.
-- Note: categories and delivery_zones have the same gap; they will be fixed
-- when those admin screens are built.

-- ─── PRODUCTS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_staff_all" ON products;

CREATE POLICY "products_staff_select"
  ON products FOR SELECT TO authenticated
  USING (get_staff_role() IS NOT NULL);

CREATE POLICY "products_admin_insert"
  ON products FOR INSERT TO authenticated
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "products_admin_update"
  ON products FOR UPDATE TO authenticated
  USING   (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "products_admin_delete"
  ON products FOR DELETE TO authenticated
  USING (get_staff_role() = 'admin');

-- ─── COMBO_ITEMS ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "combo_items_staff_all" ON combo_items;

CREATE POLICY "combo_items_staff_select"
  ON combo_items FOR SELECT TO authenticated
  USING (get_staff_role() IS NOT NULL);

CREATE POLICY "combo_items_admin_insert"
  ON combo_items FOR INSERT TO authenticated
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "combo_items_admin_update"
  ON combo_items FOR UPDATE TO authenticated
  USING   (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "combo_items_admin_delete"
  ON combo_items FOR DELETE TO authenticated
  USING (get_staff_role() = 'admin');
