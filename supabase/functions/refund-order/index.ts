import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Looks up the approved MP payment for the order and calls the MP Refunds API.
// Always returns a result — network errors are caught and returned as refundStatus='error'
// so the caller can always update order_status to 'rejected' regardless of outcome.
async function attemptMpRefund(
  db: ReturnType<typeof createClient>,
  orderId: string,
): Promise<{ refundStatus: string; refundErrorDetail: string | null }> {
  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  if (!accessToken) {
    return { refundStatus: 'error', refundErrorDetail: 'MP_ACCESS_TOKEN no configurado' };
  }

  const { data: txn } = await db
    .from('payment_transactions')
    .select('provider_reference')
    .eq('order_id', orderId)
    .eq('provider', 'mercadopago')
    .eq('status', 'approved')
    .maybeSingle();

  if (!txn?.provider_reference) {
    return {
      refundStatus: 'error',
      refundErrorDetail: 'No se encontró el pago aprobado de Mercado Pago para esta orden',
    };
  }

  try {
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${txn.provider_reference}/refunds`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: '{}', // sin amount = reintegro total
      },
    );

    if (mpRes.ok) {
      return { refundStatus: 'reintegrado', refundErrorDetail: null };
    }

    const errorText = await mpRes.text();
    return {
      refundStatus: 'error',
      refundErrorDetail: `MP API ${mpRes.status}: ${errorText}`,
    };
  } catch (err) {
    return {
      refundStatus: 'error',
      refundErrorDetail: `Error de red al contactar Mercado Pago: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Validate caller role (cashier or admin) ─────────────────────────
    // Same pattern as create-staff-user: forward the caller's JWT to the anon
    // client so the staff_self_select RLS policy lets us read their own staff row.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Falta el header Authorization' }, 401);

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Token inválido o expirado' }, 401);

    const { data: caller, error: staffErr } = await callerClient
      .from('staff')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (staffErr || !caller || !caller.is_active || !['cashier', 'admin'].includes(caller.role)) {
      return json({ error: 'Acceso denegado: se requiere rol de cajero o admin activo' }, 403);
    }

    // ── 2. Parse body ──────────────────────────────────────────────────────
    const body = await req.json() as {
      action?: string;
      order_id?: string;
      reason?: string;
    };

    const { action, order_id } = body;
    if (!action || !order_id) {
      return json({ error: 'Los campos action y order_id son requeridos' }, 400);
    }

    // ── 3. Service-role client for DB writes (bypasses RLS) ───────────────
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── 4a. action: 'reject' ───────────────────────────────────────────────
    if (action === 'reject') {
      const reason = (body.reason ?? '').trim();
      if (!reason) {
        return json({ error: 'El campo reason no puede estar vacío' }, 400);
      }

      const { data: order, error: orderErr } = await db
        .from('orders')
        .select('order_status, payment_method')
        .eq('id', order_id)
        .maybeSingle();

      if (orderErr || !order) {
        return json({ error: 'Orden no encontrada' }, 404);
      }

      if (order.order_status !== 'pending') {
        return json(
          {
            error: `Solo se puede rechazar un pedido en estado 'pending'. Estado actual: '${order.order_status}'`,
          },
          400,
        );
      }

      let refundStatus: string;
      let refundErrorDetail: string | null = null;

      if (order.payment_method === 'cash') {
        refundStatus = 'no_aplica';
      } else if (order.payment_method === 'transfer') {
        refundStatus = 'pendiente';
      } else {
        // mercadopago — attemptMpRefund siempre devuelve un resultado, nunca lanza
        ({ refundStatus, refundErrorDetail } = await attemptMpRefund(db, order_id));
      }

      // order_status siempre avanza a 'rejected' sin importar el resultado del refund.
      await db.from('orders').update({
        order_status: 'rejected',
        rejection_reason: reason,
        refund_status: refundStatus,
        refund_error_detail: refundErrorDetail,
      }).eq('id', order_id);

      return json(
        {
          order_status: 'rejected',
          refund_status: refundStatus,
          ...(refundErrorDetail !== null && { refund_error_detail: refundErrorDetail }),
        },
        200,
      );
    }

    // ── 4b. action: 'retry_refund' ─────────────────────────────────────────
    if (action === 'retry_refund') {
      const { data: order, error: orderErr } = await db
        .from('orders')
        .select('order_status, refund_status, payment_method')
        .eq('id', order_id)
        .maybeSingle();

      if (orderErr || !order) {
        return json({ error: 'Orden no encontrada' }, 404);
      }

      if (
        order.order_status !== 'rejected' ||
        order.refund_status !== 'error' ||
        order.payment_method !== 'mercadopago'
      ) {
        return json(
          {
            error:
              'El reintento de reintegro solo aplica a pedidos con ' +
              "order_status='rejected', refund_status='error' y payment_method='mercadopago'",
          },
          400,
        );
      }

      const { refundStatus, refundErrorDetail } = await attemptMpRefund(db, order_id);

      // Solo se actualizan los campos de reintegro — order_status y rejection_reason
      // quedan intactos desde el rechazo original.
      await db.from('orders').update({
        refund_status: refundStatus,
        refund_error_detail: refundErrorDetail,
      }).eq('id', order_id);

      return json(
        {
          order_status: 'rejected',
          refund_status: refundStatus,
          ...(refundErrorDetail !== null && { refund_error_detail: refundErrorDetail }),
        },
        200,
      );
    }

    return json({ error: `Acción desconocida: '${action}'` }, 400);

  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Error interno del servidor' },
      500,
    );
  }
});
