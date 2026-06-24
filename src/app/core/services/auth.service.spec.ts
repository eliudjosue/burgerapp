import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SupabaseClientService } from '../supabase.client';

const MOCK_STAFF = { name: 'Ana García', role: 'admin', is_active: true };

type AuthClientStub = {
  getSession: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
};

async function makeService(opts: {
  sessionUserId?: string;
  staffData?: typeof MOCK_STAFF | null;
  signInError?: boolean;
} = {}): Promise<{
  service: AuthService;
  authClient: AuthClientStub;
  staffMaybeSingle: ReturnType<typeof vi.fn>;
}> {
  const staffMaybeSingle = vi.fn().mockResolvedValue({
    data: opts.staffData !== undefined ? opts.staffData : null,
    error: null,
  });

  const authClient: AuthClientStub = {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: opts.sessionUserId ? { user: { id: opts.sessionUserId } } : null,
      },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue(
      opts.signInError
        ? { data: null, error: { message: 'Invalid credentials' } }
        : { data: { user: { id: 'user-123' } }, error: null },
    ),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };

  await TestBed.configureTestingModule({
    providers: [
      {
        provide: SupabaseClientService,
        useValue: {
          client: {
            auth: authClient,
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: staffMaybeSingle,
            }),
          },
        },
      },
    ],
  }).compileComponents();

  const service = TestBed.inject(AuthService);
  await service.initPromise;

  return { service, authClient, staffMaybeSingle };
}

describe('AuthService', () => {
  it('should start with null staffProfile when there is no session', async () => {
    const { service } = await makeService();
    expect(service.staffProfile()).toBeNull();
  });

  it('should restore staffProfile from an existing session on init', async () => {
    const { service } = await makeService({
      sessionUserId: 'user-123',
      staffData: MOCK_STAFF,
    });
    expect(service.staffProfile()?.name).toBe(MOCK_STAFF.name);
    expect(service.staffProfile()?.role).toBe('admin');
  });

  it('should not set staffProfile if the session exists but staff row is_active=false', async () => {
    const { service } = await makeService({
      sessionUserId: 'user-123',
      staffData: { ...MOCK_STAFF, is_active: false },
    });
    expect(service.staffProfile()).toBeNull();
  });

  it('should not set staffProfile if the session exists but no staff row is found', async () => {
    const { service } = await makeService({
      sessionUserId: 'user-123',
      staffData: null,
    });
    expect(service.staffProfile()).toBeNull();
  });

  it('should set staffProfile on successful signIn', async () => {
    const { service, staffMaybeSingle } = await makeService();
    staffMaybeSingle.mockResolvedValue({ data: MOCK_STAFF, error: null });

    await service.signIn('admin@burger.com', 'correctpassword');

    expect(service.staffProfile()?.name).toBe(MOCK_STAFF.name);
    expect(service.staffProfile()?.role).toBe('admin');
  });

  it('should throw on invalid credentials and leave staffProfile null', async () => {
    const { service } = await makeService({ signInError: true });

    await expect(service.signIn('wrong@test.com', 'badpass')).rejects.toThrow(
      'Credenciales inválidas',
    );
    expect(service.staffProfile()).toBeNull();
  });

  it('should throw and call signOut if signIn succeeds but no staff row exists', async () => {
    const { service, authClient } = await makeService();
    // staffMaybeSingle returns null by default (no staff row)

    await expect(service.signIn('user@test.com', 'pass')).rejects.toThrow('no tiene acceso');
    expect(authClient.signOut).toHaveBeenCalled();
    expect(service.staffProfile()).toBeNull();
  });

  it('should clear staffProfile on signOut', async () => {
    const { service, staffMaybeSingle } = await makeService();
    staffMaybeSingle.mockResolvedValue({ data: MOCK_STAFF, error: null });
    await service.signIn('admin@burger.com', 'pass');
    expect(service.staffProfile()).not.toBeNull();

    await service.signOut();

    expect(service.staffProfile()).toBeNull();
  });
});
