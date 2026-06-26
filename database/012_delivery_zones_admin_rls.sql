-- 012_delivery_zones_admin_rls.sql
-- Tighten write access on delivery_zones to admin-only.
--
-- Previously the table had FOR ALL for any active staff member (IS NOT NULL).
-- business.md §4: role permissions must be enforced at the data level, not just
-- in the frontend guard — a cashier JWT must not be able to modify delivery zones.
--
-- Split: all staff can SELECT; only admin can INSERT/UPDATE/DELETE.
-- The public read policy (anon, active-only) is untouched.
--
-- Idempotency: uses DROP POLICY IF EXISTS + CREATE POLICY. Safe to re-run.

DROP POLICY IF EXISTS "delivery_zones_staff_all" ON delivery_zones;

CREATE POLICY "delivery_zones_staff_select"
  ON delivery_zones FOR SELECT TO authenticated
  USING (get_staff_role() IS NOT NULL);

CREATE POLICY "delivery_zones_admin_insert"
  ON delivery_zones FOR INSERT TO authenticated
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "delivery_zones_admin_update"
  ON delivery_zones FOR UPDATE TO authenticated
  USING   (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "delivery_zones_admin_delete"
  ON delivery_zones FOR DELETE TO authenticated
  USING (get_staff_role() = 'admin');
