-- Seed delivery zones for the checkout dropdown.
-- Idempotent: skips if delivery_zones already has rows.
-- Execute via Supabase dashboard → SQL Editor.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM delivery_zones LIMIT 1) THEN
    RAISE NOTICE 'Seed skipped: delivery_zones table is not empty.';
    RETURN;
  END IF;

  INSERT INTO delivery_zones (id, name, cost, is_active, sort_order) VALUES
    ('centro', 'Centro',       500.00, true, 1),
    ('norte',  'Barrio Norte', 800.00, true, 2),
    ('sur',    'Barrio Sur',   800.00, true, 3),
    ('oeste',  'Barrio Oeste', 1000.00, true, 4);

END $$;
