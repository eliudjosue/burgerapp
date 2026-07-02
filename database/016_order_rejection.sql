-- 016_order_rejection.sql
-- Agrega 'rejected' a order_status y las columnas para motivo de rechazo
-- y ciclo de vida del reintegro.
--
-- order_status usa TEXT con un CHECK constraint auto-nombrado por PostgreSQL
-- (no es un enum). Se debe drop + re-crear para agregar el nuevo valor.
--
-- 'rejected' es distinto de 'cancelled': cancelled es una cancelación
-- administrativa genérica (solo admin, sin motivo ni reintegro estructurado).
-- rejected es un rechazo del cajero con motivo obligatorio y ciclo de vida
-- de reintegro propio (mercadopago automático / transferencia manual).
--
-- RLS: no se necesitan políticas nuevas. La política orders_staff_update ya
-- concede UPDATE sobre todas las filas de orders a cualquier staff activo
-- (kitchen/cashier/admin), lo que cubre automáticamente las nuevas columnas.

-- ─── 1. AMPLIAR VALORES PERMITIDOS EN order_status ─────────────────────────
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN (
    'pending', 'confirmed', 'preparing',
    'ready', 'on_the_way', 'delivered', 'cancelled', 'rejected'
  ));

-- ─── 2. AGREGAR COLUMNAS DE RECHAZO Y REINTEGRO ─────────────────────────────
-- refund_confirmed_by usa ON DELETE RESTRICT explícito (igual al default
-- NO ACTION, pero documentado a simple vista): si se intenta eliminar un
-- miembro de staff que confirmó un reintegro, el delete falla y obliga a
-- resolver la trazabilidad antes de proceder.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS rejection_reason    TEXT,
  ADD COLUMN IF NOT EXISTS refund_status       TEXT
    CHECK (refund_status IN ('no_aplica', 'pendiente', 'reintegrado', 'error')),
  ADD COLUMN IF NOT EXISTS refund_error_detail TEXT,
  ADD COLUMN IF NOT EXISTS refund_confirmed_by UUID
    REFERENCES staff(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS refund_confirmed_at TIMESTAMPTZ;
