-- 013_site_assets_storage.sql
-- Supabase Storage: bucket and RLS policies for site assets (logo, banner).
-- Same security pattern as 008_storage_setup.sql (product-images):
--   public read, admin-only write.
--
-- Run AFTER 003_rls.sql (requires public.get_staff_role() to exist).
-- Idempotent:
--   - Bucket insert uses ON CONFLICT DO NOTHING.
--   - Policies use CREATE POLICY (no IF NOT EXISTS in Postgres).
--     Re-running will error "policy already exists" — drop first if needed.

-- ─── BUCKET ────────────────────────────────────────────────────────────────
-- public = true  → files accessible via the public URL without auth.
-- 2 MB limit and same MIME types as product-images for consistency.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  2097152,                                    -- 2 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── RLS POLICIES ON storage.objects ───────────────────────────────────────

-- 1. Public read — anyone (anon or authenticated) can read site assets.
CREATE POLICY "site_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

-- 2. Admin upload — only admin staff can insert new files.
CREATE POLICY "site_assets_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets'
    AND public.get_staff_role() = 'admin'
  );

-- 3. Admin replace — only admin staff can overwrite existing files.
CREATE POLICY "site_assets_admin_update"
  ON storage.objects FOR UPDATE
  USING   (bucket_id = 'site-assets' AND public.get_staff_role() = 'admin')
  WITH CHECK (bucket_id = 'site-assets' AND public.get_staff_role() = 'admin');

-- 4. Admin delete — only admin staff can delete files.
CREATE POLICY "site_assets_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND public.get_staff_role() = 'admin');
