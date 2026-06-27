import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ----- helpers ---------------------------------------------------------------

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ----- signature validation --------------------------------------------------

async function verifySignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!secret) {
    console.error('MP_WEBHOOK_SECRET not configured');
    return false;
  }

  const xSignature = req.headers.get('x-signature');
  if (!xSignature) return false;

  // Format: ts=<timestamp>,v1=<hmac_hex>
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }

  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  // x-request-id may be absent; treat as empty string per MP spec
  const requestId = req.headers.get('x-request-id') ?? '';

  // Signed manifest per official MP webhook validation spec:
  // https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts}`;
  const expected = await hmacSha256(secret, manifest);

  return expected === v1;
}

// ----- types -----------------------------------------------------------------

interface MpNotification {
  type?: string;
  action?: string;
  data?: { id: string | number };
}

interface MpPayment {
  id: number;
  status: string; // 'approved' | 'rejected' | 'cancelled' | 'pending' | ...
  external_reference: string | null;
  transaction_amount: number;
}

// ----- main ------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return json({ error: 'Cannot read body' }, 400);
  }

  let notification: MpNotification;
  try {
    notification = JSON.parse(rawBody) as MpNotification;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Accept MP test/configuration-ping notifications without signature check
  if (notification.action === 'test' || notification.type === 'test') {
    return json({ received: true }, 200);
  }

  // Only process payment notifications
  if (notification.type !== 'payment') {
    return json({ received: true }, 200);
  }

  const dataId = String(notification.data?.id ?? '');
  if (!dataId) {
    return json({ received: true }, 200);
  }

  // Reject anything that doesn't carry a valid HMAC — stops spoofed notifications
  const valid = await verifySignature(req, dataId);
  if (!valid) {
    console.error(`Invalid webhook signature for payment ${dataId}`);
    return json({ error: 'Invalid signature' }, 400);
  }

  try {
    await processPaymentNotification(dataId);
  } catch (err) {
    // Log but still return 200: returning non-2xx would cause MP to retry
    // indefinitely for transient errors that we need to handle differently.
    // Check Supabase logs for "Error processing payment" entries.
    console.error(`Error processing payment ${dataId}:`, err);
  }

  return json({ received: true }, 200);
});

// ----- payment processing ----------------------------------------------------

async function processPaymentNotification(paymentId: string): Promise<void> {
  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  // 1. Fetch authoritative payment state from MP — never trust notification body alone
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!mpRes.ok) {
    throw new Error(`MP API ${mpRes.status}: ${await mpRes.text()}`);
  }

  const payment = await mpRes.json() as MpPayment;
  const { status, external_reference, transaction_amount } = payment;

  // external_reference was set to order_number in create-mp-preference
  if (!external_reference) {
    console.warn(`Payment ${paymentId} has no external_reference — skipping`);
    return;
  }

  // Only act on terminal states; pending/in_process will trigger another notification later
  if (status !== 'approved' && status !== 'rejected' && status !== 'cancelled') {
    return;
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 2. Look up the order by order_number (= external_reference)
  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('id, payment_status')
    .eq('order_number', external_reference)
    .maybeSingle();

  if (orderErr || !order) {
    console.warn(`Order ${external_reference} not found (payment ${paymentId})`);
    return;
  }

  const paymentIdStr = String(payment.id);

  // 3. Idempotency guard: skip if this exact payment ID was already recorded
  const { data: existing } = await db
    .from('payment_transactions')
    .select('id')
    .eq('order_id', order.id)
    .eq('provider_reference', paymentIdStr)
    .maybeSingle();

  if (existing) {
    console.log(`Payment ${paymentId} already recorded for order ${external_reference} — skipping`);
    return;
  }

  // 4a. Approved: mark the order as paid and insert the transaction record
  if (status === 'approved') {
    if (order.payment_status !== 'confirmed') {
      await db
        .from('orders')
        .update({ payment_status: 'confirmed' })
        .eq('id', order.id);
    }

    await db.from('payment_transactions').insert({
      order_id: order.id,
      provider: 'mercadopago',
      provider_reference: paymentIdStr,
      amount: transaction_amount,
      status: 'approved',
    });

    return;
  }

  // 4b. Rejected / cancelled: record the failed attempt; do NOT touch order_status
  // (business.md §2.3: order_status and payment_status are always independent)
  await db.from('payment_transactions').insert({
    order_id: order.id,
    provider: 'mercadopago',
    provider_reference: paymentIdStr,
    amount: transaction_amount,
    status: 'rejected',
  });
}
