-- Helper functions shared across the database.
-- Execute this script FIRST, before 002_schema.sql.
-- All functions use CREATE OR REPLACE, so this script is safe to re-run.

-- Automatically sets updated_at to the current timestamp on any row update.
-- Attach this trigger to every table that has an updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Generates a unique 6-character alphanumeric order code.
-- Uses an unambiguous alphabet (excludes 0/O/1/I) to reduce misreading.
-- Called as the DEFAULT value for orders.order_number.
-- Not sequential by design: prevents guessing another customer's order number.
--
-- Retries on collision: if the generated code already exists in orders, it loops
-- until it finds a free one. With ~1.28M combinations and low traffic volume this
-- will virtually never loop, but the check prevents a UNIQUE constraint violation
-- from surfacing as an opaque checkout error.
--
-- Relies on deferred resolution (LANGUAGE plpgsql): the reference to the orders
-- table inside the function body is resolved at call time, not at CREATE FUNCTION
-- time — so this function can safely be defined before orders is created.
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet       text    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result         text;
  i              int;
  already_exists boolean;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    END LOOP;

    SELECT EXISTS(
      SELECT 1 FROM orders WHERE order_number = result
    ) INTO already_exists;

    IF NOT already_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;
