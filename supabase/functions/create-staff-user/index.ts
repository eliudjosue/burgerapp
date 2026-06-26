import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Role = 'kitchen' | 'cashier' | 'admin';
const VALID_ROLES: Role[] = ['kitchen', 'cashier', 'admin'];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Validate that the caller is an active admin ──────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Falta el header Authorization' }, 401);

    // Forward the caller's JWT to verify identity via the anon client.
    // The staff.staff_self_select RLS policy lets any authenticated user read
    // their own row, so this lookup is safe without service_role.
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

    if (staffErr || !caller || caller.role !== 'admin' || !caller.is_active) {
      return json({ error: 'Acceso denegado: se requiere rol de admin activo' }, 403);
    }

    // ── 2. Parse and validate the request body ──────────────────────────────
    const { email, password, name, role } = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
    };

    const trimmedEmail = (email ?? '').trim();
    const trimmedName = (name ?? '').trim();

    if (!trimmedEmail || !password || !trimmedName || !VALID_ROLES.includes(role as Role)) {
      return json(
        { error: 'Los campos email, password, name y role (kitchen|cashier|admin) son requeridos' },
        400,
      );
    }

    // ── 3. Create the Auth user via service_role ────────────────────────────
    // service_role key is injected automatically by Supabase — never exposed to clients.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true, // skip email-verification flow for staff accounts
    });

    if (createErr || !created.user) {
      return json(
        { error: createErr?.message ?? 'Error al crear el usuario en Auth' },
        422,
      );
    }

    const userId = created.user.id;

    // ── 4. Insert the staff profile row ────────────────────────────────────
    const { error: insertErr } = await adminClient
      .from('staff')
      .insert({ id: userId, name: trimmedName, role: role as Role });

    if (insertErr) {
      // Compensating delete: remove the Auth user to prevent an orphaned account
      // (staff row missing → login would fail at AuthService.loadAndSetProfile).
      // If this delete also fails the Auth user will remain without a staff row;
      // the Supabase Auth dashboard can be used to clean it up manually.
      await adminClient.auth.admin.deleteUser(userId);
      return json(
        { error: 'Error al crear el perfil de staff. El usuario de Auth fue revertido.' },
        500,
      );
    }

    return json({ id: userId, email: trimmedEmail, name: trimmedName, role }, 201);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Error interno del servidor' },
      500,
    );
  }
});
