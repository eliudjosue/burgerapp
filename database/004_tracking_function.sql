-- Public order tracking RPC (business.md §2.1).
-- Execute 003_rls.sql first.
--
-- Why a SECURITY DEFINER function instead of an RLS SELECT policy for anon:
--   RLS policies evaluate conditions row-by-row using only the caller's JWT
--   claims — they have no access to parameters the user typed in a form. A
--   permissive SELECT policy for anon would expose all orders to anyone who
--   queries the table, regardless of what they filter by. A SECURITY DEFINER
--   function is the controlled gateway: it receives both identifiers explicitly,
--   verifies them server-side, and returns only the columns the tracking page
--   needs. This is Supabase's recommended pattern for "lookup by non-auth
--   identifier" (RPC + SECURITY DEFINER).
--
-- Security properties:
--   - Requires BOTH order_number AND customer_phone to match (double factor).
--   - Returns 0 rows if either is wrong — no indication of which one failed.
--   - Does NOT return payment_status, payment_method, total, or customer_phone.
--   - SET search_path = public prevents search_path injection attacks.

CREATE OR REPLACE FUNCTION get_order_for_tracking(
  p_order_number text,
  p_phone        text
)
RETURNS TABLE (
  id             uuid,
  order_number   text,
  order_status   text,
  delivery_type  text,
  created_at     timestamptz,
  updated_at     timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    o.id,
    o.order_number,
    o.order_status,
    o.delivery_type,
    o.created_at,
    o.updated_at
  FROM orders o
  WHERE o.order_number = p_order_number
    AND o.customer_phone = p_phone;
$$;

-- Grant EXECUTE to anon (public tracking page) and authenticated (staff can use
-- it too, e.g. when looking up a customer's order by their reported code).
GRANT EXECUTE ON FUNCTION get_order_for_tracking(text, text) TO anon, authenticated;
