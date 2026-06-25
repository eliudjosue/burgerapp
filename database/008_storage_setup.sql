-- 008_storage_setup.sql
-- Supabase Storage: bucket and RLS policies for product images.
--
-- Run AFTER 003_rls.sql (requires public.get_staff_role() to exist).
-- Idempotent:
--   - Bucket insert uses ON CONFLICT DO NOTHING.
--   - Policies use CREATE POLICY (no IF NOT EXISTS in Postgres).
--     Re-running will error "policy already exists" — drop first if needed.

-- ─── BUCKET ────────────────────────────────────────────────────────────────
-- public = true  → files are accessible via the public URL
--                  (/storage/v1/object/public/product-images/…) without auth.
-- file_size_limit enforced server-side (defense-in-depth alongside client validation).
-- allowed_mime_types also enforced server-side.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  2097152,                                    -- 2 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── RLS POLICIES ON storage.objects ───────────────────────────────────────
-- Supabase Storage has RLS enabled on storage.objects by default.
-- The public URL path bypasses RLS entirely (handled at the HTTP layer),
-- so the SELECT policy below mainly covers SDK-level access (list, download).

-- 1. Public read — anyone (anon or authenticated) can read product images.
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 2. Admin upload — only admin staff can insert new files.
--    public.get_staff_role() queries staff WHERE id = auth.uid() AND is_active = true.
--    Returns NULL for non-staff or inactive users → WITH CHECK fails → upload denied.
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.get_staff_role() = 'admin'
  );

-- 3. Admin replace — only admin staff can overwrite existing files.
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING   (bucket_id = 'product-images' AND public.get_staff_role() = 'admin')
  WITH CHECK (bucket_id = 'product-images' AND public.get_staff_role() = 'admin');

-- 4. Admin delete — only admin staff can delete files.
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.get_staff_role() = 'admin');
