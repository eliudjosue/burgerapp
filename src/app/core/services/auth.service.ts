import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClientService } from '../supabase.client';

export interface StaffProfile {
  name: string;
  role: 'kitchen' | 'cashier' | 'admin';
}

interface DbStaffRow {
  name: string;
  role: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);

  readonly staffProfile = signal<StaffProfile | null>(null);

  // Resolves once the initial session check completes.
  // The auth guard awaits this before reading staffProfile, so page-reload
  // session restoration is always settled before routing decisions are made.
  readonly initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.client.auth.getSession();
    if (session?.user) {
      await this.loadAndSetProfile(session.user.id);
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error('Credenciales inválidas. Verificá tu email y contraseña.');
    }

    const loaded = await this.loadAndSetProfile(data.user.id);
    if (!loaded) {
      await this.supabase.client.auth.signOut();
      throw new Error(
        'Tu cuenta no tiene acceso al panel de staff o está desactivada. Contactá al administrador.',
      );
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.staffProfile.set(null);
  }

  // Returns true if a valid, active staff row was found and the profile was set.
  private async loadAndSetProfile(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('staff')
      .select('name, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data || !(data as DbStaffRow).is_active) {
      return false;
    }

    const row = data as DbStaffRow;
    this.staffProfile.set({ name: row.name, role: row.role as StaffProfile['role'] });
    return true;
  }
}
