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

interface OrderItem {
  product_name: string;
  product_price: string; // numeric → string from PostgREST
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_phone: string;
  payment_method: string;
  order_status: string;
  total: string; // numeric → string from PostgREST
  order_items: OrderItem[];
}

interface MpPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Parse and validate input ──────────────────────────────────────────
    // We accept order_number (the value create_order returns to the client)
    // rather than the internal UUID, since that's what the frontend has.
    const body = await req.json() as { order_number?: string; customer_phone?: string };
    const orderNumber = (body.order_number ?? '').trim();
    const customerPhone = (body.customer_phone ?? '').trim();

    if (!orderNumber || !customerPhone) {
      return json({ error: 'order_number y customer_phone son requeridos' }, 400);
    }

    // ── 2. Load order from DB via service_role ───────────────────────────────
    // anon has INSERT but no SELECT on orders (RLS policy).
    // service_role bypasses RLS safely here: we read server-side data only and
    // never echo customer details or prices back to the caller — only a payment URL.
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: raw, error: orderErr } = await db
      .from('orders')
      .select(`
        id,
        order_number,
        customer_phone,
        payment_method,
        order_status,
        total,
        order_items ( product_name, product_price, quantity )
      `)
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (orderErr || !raw) {
      return json({ error: 'Pedido no encontrado' }, 404);
    }

    const order = raw as Order;

    // ── 3. Validate preconditions ────────────────────────────────────────────
    // Same two-factor pattern as get_order_for_tracking: order_number + phone
    // must both match. Generic message avoids revealing which field was wrong.
    if (order.customer_phone !== customerPhone) {
      return json({ error: 'Los datos del pedido no coinciden' }, 403);
    }

    if (order.payment_method !== 'mercadopago') {
      return json({ error: 'Este pedido no usa Mercado Pago como método de pago' }, 422);
    }

    if (order.order_status === 'cancelled') {
      return json({ error: 'El pedido fue cancelado' }, 422);
    }

    if (!order.order_items?.length) {
      return json({ error: 'El pedido no tiene items' }, 422);
    }

    // ── 4. Build and send the MP preference ──────────────────────────────────
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');

    // Trailing slash stripped to avoid double-slash in URLs.
    const frontendUrl = (Deno.env.get('FRONTEND_URL') ?? 'http://localhost:4200').replace(/\/$/, '');

    // MP notification URL — left unset until mp-webhook is deployed.
    // Set the MP_WEBHOOK_URL secret once that function exists.
    const webhookUrl = Deno.env.get('MP_WEBHOOK_URL') ?? '';

    const items = order.order_items.map((item) => ({
      title: item.product_name,
      quantity: item.quantity,
      // product_price comes as string from PostgREST; MP requires a number.
      unit_price: Number(item.product_price),
      currency_id: 'ARS',
    }));

    const preference: Record<string, unknown> = {
      items,
      back_urls: {
        success: `${frontendUrl}/order-confirmation?orderNumber=${order.order_number}`,
        pending: `${frontendUrl}/order-pending?orderNumber=${order.order_number}`,
        failure: `${frontendUrl}/order-failed?orderNumber=${order.order_number}`,
      },
      // auto_return: 'approved' redirects automatically on success; other
      // outcomes (failure/pending) always redirect.
      auto_return: 'approved',
      // external_reference is echoed back by MP in webhook notifications,
      // which is how mp-webhook will identify which order to update.
      external_reference: order.order_number,
    };

    if (webhookUrl) preference['notification_url'] = webhookUrl;

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const mpErr = await mpRes.text();
      throw new Error(`MP error ${mpRes.status}: ${mpErr}`);
    }

    const mpPreference = await mpRes.json() as MpPreferenceResponse;

    // ── 5. Record a pending payment_transaction ──────────────────────────────
    // provider_reference stores the MP preference ID so the webhook can later
    // match it to a specific payment attempt.
    await db.from('payment_transactions').insert({
      order_id: order.id,
      provider: 'mercadopago',
      provider_reference: mpPreference.id,
      amount: Number(order.total),
      status: 'pending',
    });

    // ── 6. Return the correct checkout URL ───────────────────────────────────
    // TEST-* tokens → sandbox_init_point.
    // APP_USR-* tokens → init_point (production).
    const isSandbox = accessToken.startsWith('TEST-');
    const paymentUrl = isSandbox ? mpPreference.sandbox_init_point : mpPreference.init_point;

    return json({ payment_url: paymentUrl, preference_id: mpPreference.id }, 200);

  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Error interno del servidor' },
      500,
    );
  }
});
