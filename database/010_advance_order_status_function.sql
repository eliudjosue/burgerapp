-- advance_order_status: validates order state transitions server-side.
-- Runs as SECURITY DEFINER so it can read orders regardless of anon policy.
-- Enforces per-role transition rules from business.md §2.4-2.5:
--   kitchen : confirmed → preparing → ready
--   cashier : pending → confirmed, ready → on_the_way|delivered, on_the_way → delivered
--   admin   : all valid forward transitions + cancellation from any non-terminal state

CREATE OR REPLACE FUNCTION advance_order_status(
  p_order_id  uuid,
  p_new_status text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role    text;
  v_current text;
BEGIN
  v_role := get_staff_role();
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  SELECT order_status INTO v_current FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  -- Each branch validates transitions for exactly one recognized role.
  -- The ELSE clause ensures any future role added to staff.role is rejected
  -- explicitly instead of silently bypassing all checks.
  IF v_role = 'kitchen' THEN
    -- Cocina: can only advance within the preparation lifecycle.
    IF NOT (
      (v_current = 'confirmed' AND p_new_status = 'preparing') OR
      (v_current = 'preparing' AND p_new_status = 'ready')
    ) THEN
      RAISE EXCEPTION 'invalid_transition';
    END IF;

  ELSIF v_role = 'cashier' THEN
    -- Caja: confirms new orders and manages the delivery/pickup handoff.
    IF NOT (
      (v_current = 'pending'    AND p_new_status = 'confirmed') OR
      (v_current = 'ready'      AND p_new_status = 'on_the_way') OR
      (v_current = 'ready'      AND p_new_status = 'delivered') OR
      (v_current = 'on_the_way' AND p_new_status = 'delivered')
    ) THEN
      RAISE EXCEPTION 'invalid_transition';
    END IF;

  ELSIF v_role = 'admin' THEN
    -- Admin: all forward transitions + cancellation.
    -- Terminal states (delivered, cancelled) block all further transitions implicitly
    -- because none of their current-status combinations appear in the allowed set.
    IF NOT (
      (v_current = 'pending'    AND p_new_status IN ('confirmed',  'cancelled')) OR
      (v_current = 'confirmed'  AND p_new_status IN ('preparing',  'cancelled')) OR
      (v_current = 'preparing'  AND p_new_status IN ('ready',      'cancelled')) OR
      (v_current = 'ready'      AND p_new_status IN ('on_the_way', 'delivered', 'cancelled')) OR
      (v_current = 'on_the_way' AND p_new_status IN ('delivered',  'cancelled'))
    ) THEN
      RAISE EXCEPTION 'invalid_transition';
    END IF;

  ELSE
    RAISE EXCEPTION 'unrecognized_role: %', v_role;
  END IF;

  UPDATE orders SET order_status = p_new_status WHERE id = p_order_id;
  RETURN p_new_status;
END;
$$;

GRANT EXECUTE ON FUNCTION advance_order_status(uuid, text) TO authenticated;
