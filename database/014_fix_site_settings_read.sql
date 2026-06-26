-- Fix: site_settings_public_read was TO anon only, blocking reads for authenticated users.
-- Admin screen (and any logged-in user) hit PGRST116 because no SELECT policy matched.
-- Write access remains admin-only via site_settings_admin_update.

DROP POLICY IF EXISTS "site_settings_public_read" ON site_settings;

CREATE POLICY "site_settings_read"
  ON site_settings FOR SELECT TO anon, authenticated
  USING (true);
