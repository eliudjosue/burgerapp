-- RPC: create an order from the public checkout and return its order_number.
--
-- Why SECURITY DEFINER (same reasoning as 004_tracking_function.sql):
--   The RLS policy on orders grants anon INSERT but NO SELECT.
--   PostgREST enforces the SELECT policy even for RETURNING data on INSERT,
--   so anon cannot get back the generated order_number via a plain insert.
--   A SECURITY DEFINER function bypasses RLS, does the insert + item inserts
--   atomically, and safely returns only the order_number to the caller.
--
-- Security properties:
--   - Prices and totals are calculated server-side from products/delivery_zones.
--     The client cannot influence the stored subtotal, shipping_cost, or total —
--     only product_id + quantity are trusted from the caller.
--   - Rejects orders with empty items or unknown/inactive products.
--   - Rejects delivery orders with unknown/inactive delivery zones.
--   - All DB constraints still apply (CHECK on delivery_type, payment_method, etc.)
--   - The function only exposes order_number — no payment status, total, or phone.
--   - SET search_path = public prevents search_path injection.
--   - Execute 003_rls.sql and 008_seed_delivery_zones.sql before this file.
--
-- NOTE: This script DROPs the previous version of create_order (11 parameters)
-- and replaces it with a new version (8 parameters). Run the full script in a
-- single transaction in the Supabase SQL Editor.

DROP FUNCTION IF EXISTS create_order(
  text, text, text, text, text, text, text, numeric, numeric, numeric, jsonb
);

CREATE OR REPLACE FUNCTION create_order(
  p_customer_name    text,
  p_customer_phone   text,
  p_delivery_type    text,
  p_address          text,
  p_delivery_zone_id text,
  p_comments         text,
  p_payment_method   text,
  p_items            jsonb   -- [{product_id, quantity}]
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id      uuid;
  v_order_number  text;
  v_subtotal      numeric;
  v_shipping_cost numeric;
  v_item_count    bigint;
BEGIN
  -- Reject empty orders
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido debe contener al menos un producto';
  END IF;

  -- Calculate subtotal from server-side product prices.
  -- JOIN count must equal items count — any missing or inactive product rejects the order.
  SELECT COUNT(*), COALESCE(SUM(p.price * (i->>'quantity')::int), 0)
  INTO v_item_count, v_subtotal
  FROM jsonb_array_elements(p_items) AS i
  JOIN products p ON p.id = (i->>'product_id')::uuid AND p.is_active = true;

  IF v_item_count <> jsonb_array_length(p_items) THEN
    RAISE EXCEPTION 'Uno o más productos no existen o no están disponibles';
  END IF;

  -- Calculate shipping cost from delivery_zones; pickup is always free.
  IF p_delivery_type = 'pickup' THEN
    v_shipping_cost := 0;
  ELSE
    SELECT cost INTO v_shipping_cost
    FROM delivery_zones
    WHERE id = NULLIF(p_delivery_zone_id, '') AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Zona de delivery inválida o inactiva: %', p_delivery_zone_id;
    END IF;
  END IF;

  -- Insert order with server-calculated totals.
  INSERT INTO orders (
    customer_name, customer_phone, delivery_type, address, delivery_zone_id,
    comments, payment_method, subtotal, shipping_cost, total
  ) VALUES (
    p_customer_name,
    p_customer_phone,
    p_delivery_type,
    NULLIF(p_address, ''),
    NULLIF(p_delivery_zone_id, ''),
    NULLIF(p_comments, ''),
    p_payment_method,
    v_subtotal,
    v_shipping_cost,
    v_subtotal + v_shipping_cost
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- Insert item snapshots: name and price come from products at order time,
  -- not from the client — this preserves history if prices change later.
  INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity)
  SELECT
    v_order_id,
    p.id,
    p.name,
    p.price,
    (i->>'quantity')::int
  FROM jsonb_array_elements(p_items) AS i
  JOIN products p ON p.id = (i->>'product_id')::uuid AND p.is_active = true;

  RETURN v_order_number;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order(
  text, text, text, text, text, text, text, jsonb
) TO anon, authenticated;
