-- Update the single site_settings row with placeholder content.
-- ⚠️  ALL values below are PLACEHOLDERS — replace them with real content
--     before going live. Search for "PLACEHOLDER" to find every field
--     that still needs a real value.
-- Execute via Supabase dashboard → SQL Editor.
-- Idempotent: UPDATE on id = 1 is always safe to re-run (overwrites the row).

UPDATE site_settings SET
  -- Visible content ─────────────────────────────────────────────────────────
  business_hours      = 'Lunes a Domingo 11:00 - 22:00',

  -- PLACEHOLDER: replace with the real WhatsApp number (digits only, no +, no spaces)
  -- Example for Argentina: '5491112345678' (549 + area code without 0 + number)
  whatsapp_number     = '5400000000000',

  -- Banner ──────────────────────────────────────────────────────────────────
  banner_title        = '¡Hamburguesas Artesanales!',
  banner_subtitle     = 'Preparadas con ingredientes de primera calidad. Pedido online y entrega a domicilio.',
  banner_button_text  = 'Ver Catálogo',
  banner_button_link  = '/catalog',

  -- PLACEHOLDER: upload a real banner image to Supabase Storage and replace this NULL
  banner_image_url    = NULL,

  -- PLACEHOLDER: upload a real logo to Supabase Storage and replace this NULL
  logo_url            = NULL,

  -- Payment ─────────────────────────────────────────────────────────────────
  -- PLACEHOLDER: replace with the real bank transfer alias
  bank_transfer_alias = 'ALIAS.PENDIENTE',
  -- PLACEHOLDER: replace with the real 22-digit CBU
  bank_transfer_cbu   = '0000000000000000000000'

WHERE id = 1;
