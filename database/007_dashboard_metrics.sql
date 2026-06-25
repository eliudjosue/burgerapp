-- 007_dashboard_metrics.sql
-- Returns all admin dashboard metrics in a single RPC call.
-- Time windows are computed in Argentina local time (America/Argentina/Buenos_Aires)
-- so "today", "this week", and "this month" match the business's clock, not UTC.
--
-- RPC: get_dashboard_metrics()
-- Caller: authenticated staff (admin route guard enforces role in Angular)
-- Returns: JSON with 5 keys (see below)
-- Idempotent: yes (CREATE OR REPLACE)

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH
  -- ── 1. Time windows in Buenos Aires local time ──────────────────────────
  time_windows AS (
    SELECT
      date_trunc('day',   now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
        AT TIME ZONE 'America/Argentina/Buenos_Aires' AS today_start,
      date_trunc('week',  now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
        AT TIME ZONE 'America/Argentina/Buenos_Aires' AS week_start,
      date_trunc('month', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
        AT TIME ZONE 'America/Argentina/Buenos_Aires' AS month_start
  ),

  -- ── 2. Revenue totals (excluding cancelled orders) ──────────────────────
  sales AS (
    SELECT
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= tw.today_start), 0) AS today_sales,
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= tw.week_start),  0) AS week_sales,
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= tw.month_start), 0) AS month_sales
    FROM orders o
    CROSS JOIN time_windows tw
    WHERE o.order_status <> 'cancelled'
  ),

  -- ── 3. Orders waiting for confirmation ──────────────────────────────────
  pending AS (
    SELECT COUNT(*) AS pending_count
    FROM orders
    WHERE order_status = 'pending'
  ),

  -- ── 4. Top 3 products by units sold (excluding cancelled orders) ─────────
  top_products AS (
    SELECT
      oi.product_name,
      SUM(oi.quantity) AS total_quantity
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.order_status <> 'cancelled'
    GROUP BY oi.product_name
    ORDER BY total_quantity DESC
    LIMIT 3
  )

  -- ── Final result ─────────────────────────────────────────────────────────
  SELECT json_build_object(
    'today_sales',   (SELECT today_sales   FROM sales),
    'week_sales',    (SELECT week_sales    FROM sales),
    'month_sales',   (SELECT month_sales   FROM sales),
    'pending_count', (SELECT pending_count FROM pending),
    'top_products',  COALESCE(
                       (SELECT json_agg(
                                 json_build_object(
                                   'name',     product_name,
                                   'quantity', total_quantity
                                 )
                               )
                        FROM top_products),
                       '[]'::json
                     )
  );
$$;

-- Allow any authenticated staff to call this function.
-- The admin-only route guard in Angular is the UX layer; fine-grained
-- per-role DB restrictions are deferred to Phase 2 (business.md §4 / 003_rls.sql note).
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;
