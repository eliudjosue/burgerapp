-- 017_metrics_exclude_rejected.sql
-- Actualiza get_dashboard_metrics() para excluir también los pedidos
-- con order_status = 'rejected' del revenue y top productos,
-- igual que ya se excluyen los 'cancelled'.
--
-- 'rejected' implica que el pedido no fue aceptado ni despachado,
-- por lo que no debe contabilizarse como venta.
--
-- CREATE OR REPLACE es idempotente: no requiere drop previo.

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

  -- ── 2. Revenue totals (excluding cancelled/rejected orders) ────────────
  sales AS (
    SELECT
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= tw.today_start), 0) AS today_sales,
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= tw.week_start),  0) AS week_sales,
      COALESCE(SUM(o.total) FILTER (WHERE o.created_at >= tw.month_start), 0) AS month_sales
    FROM orders o
    CROSS JOIN time_windows tw
    WHERE o.order_status NOT IN ('cancelled', 'rejected')
  ),

  -- ── 3. Orders waiting for confirmation ──────────────────────────────────
  pending AS (
    SELECT COUNT(*) AS pending_count
    FROM orders
    WHERE order_status = 'pending'
  ),

  -- ── 4. Top 3 products by units sold (excluding cancelled/rejected orders)
  top_products AS (
    SELECT
      oi.product_name,
      SUM(oi.quantity) AS total_quantity
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.order_status NOT IN ('cancelled', 'rejected')
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

GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;
