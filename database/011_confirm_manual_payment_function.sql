-- confirm_manual_payment: atomically records a transfer payment confirmation.
-- Runs as SECURITY DEFINER; only cashier/admin can call (get_staff_role() check).
-- Inserts a payment_transactions row (provider='manual', status='approved') and
-- updates orders.payment_status = 'confirmed' in a single transaction.
-- Called from the Cashier view when staff manually verifies a bank transfer arrived.

CREATE OR REPLACE FUNCTION confirm_manual_payment(
  p_order_id  uuid,
  p_reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role           text;
  v_amount         numeric(10,2);
  v_payment_method text;
  v_payment_status text;
BEGIN
  v_role := get_staff_role();
  IF v_role NOT IN ('cashier', 'admin') THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  SELECT total, payment_method, payment_status
    INTO v_amount, v_payment_method, v_payment_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  -- Guard: only manual transfers use this flow (business.md §2.3).
  IF v_payment_method <> 'transfer' THEN
    RAISE EXCEPTION 'invalid_payment_method';
  END IF;

  -- Idempotency guard: prevent double-confirmation.
  IF v_payment_status = 'confirmed' THEN
    RAISE EXCEPTION 'payment_already_confirmed';
  END IF;

  INSERT INTO payment_transactions (order_id, provider, provider_reference, amount, status)
  VALUES (p_order_id, 'manual', p_reference, v_amount, 'approved');

  UPDATE orders
     SET payment_status = 'confirmed'
   WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_manual_payment(uuid, text) TO authenticated;
