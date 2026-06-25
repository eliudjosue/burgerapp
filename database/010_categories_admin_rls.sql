-- 010_categories_admin_rls.sql
-- Tighten write access on categories to admin-only.
--
-- Previously the table had FOR ALL for any active staff member (IS NOT NULL).
-- business.md §4: role permissions must be enforced at the data level, not just
-- in the frontend guard — a cashier JWT must not be able to modify the catalog.
--
-- Split: all staff can SELECT; only admin can INSERT/UPDATE/DELETE.
-- The public read policy (anon, active-only) is untouched.
--
-- Idempotency: uses DROP POLICY IF EXISTS + CREATE POLICY. Safe to re-run.
-- Note: delivery_zones has the same gap; it will be fixed
-- when the delivery-zones admin screen is built.

DROP POLICY IF EXISTS "categories_staff_all" ON categories;

CREATE POLICY "categories_staff_select"
  ON categories FOR SELECT TO authenticated
  USING (get_staff_role() IS NOT NULL);

CREATE POLICY "categories_admin_insert"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "categories_admin_update"
  ON categories FOR UPDATE TO authenticated
  USING   (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "categories_admin_delete"
  ON categories FOR DELETE TO authenticated
  USING (get_staff_role() = 'admin');
