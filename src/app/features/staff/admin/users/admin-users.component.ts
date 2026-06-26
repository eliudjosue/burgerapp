import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';

export type StaffRole = 'kitchen' | 'cashier' | 'admin';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  is_active: boolean;
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  kitchen: 'Cocina',
  cashier: 'Caja',
  admin: 'Admin',
};

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-dvh bg-[#f5f4f1]">

      <!-- ─── Topbar ────────────────────────────────────────────────────── -->
      <header
        class="bg-[#1c1a17] text-white px-3 py-2 flex items-center justify-between
               sticky top-0 z-20"
      >
        @if (view() === 'list') {
          <div class="flex items-center gap-2.5">
            <button
              type="button"
              (click)="goBack()"
              class="flex items-center gap-1 text-white/50 hover:text-white text-xs
                     cursor-pointer bg-transparent border-0 transition-colors"
              aria-label="Volver al dashboard de Admin"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Admin
            </button>
            <span class="font-semibold text-[15px]">Usuarios de staff</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[11px] text-white/40">
              {{ authService.staffProfile()?.name }}
            </span>
            <button
              type="button"
              (click)="logout()"
              class="text-[11px] text-white/30 underline cursor-pointer bg-transparent border-0"
            >
              Salir
            </button>
            <button
              type="button"
              (click)="openCreate()"
              class="flex items-center gap-1 bg-accent text-white text-[12px] font-semibold
                     px-3 py-1.5 rounded-lg border-0 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Nuevo
            </button>
          </div>
        } @else {
          <div class="flex items-center gap-2.5">
            <button
              type="button"
              (click)="cancelForm()"
              class="flex items-center gap-1 text-white/50 hover:text-white text-xs
                     cursor-pointer bg-transparent border-0 transition-colors"
              aria-label="Cancelar y volver al listado"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
              Cancelar
            </button>
            <span class="font-semibold text-[15px]">Nuevo usuario</span>
          </div>
          <button
            type="button"
            (click)="saveForm()"
            [disabled]="saving()"
            class="bg-accent text-white text-[12px] font-semibold px-3 py-1.5
                   rounded-lg border-0 cursor-pointer hover:opacity-90 transition-opacity
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Creando…' : 'Crear' }}
          </button>
        }
      </header>

      <!-- ─── List view ─────────────────────────────────────────────────── -->
      @if (view() === 'list') {

        @if (isLoading()) {
          <div class="flex items-center justify-center h-48 text-muted text-sm">
            Cargando usuarios…
          </div>
        } @else if (hasError()) {
          <div class="flex flex-col items-center justify-center py-16 text-center gap-2 px-4"
               role="alert">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.5"
                 class="text-danger opacity-50" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="text-sm text-muted">No se pudieron cargar los usuarios.</p>
            <button
              type="button"
              (click)="ngOnInit()"
              class="text-xs text-accent underline cursor-pointer bg-transparent border-0 mt-1"
            >
              Reintentar
            </button>
          </div>
        } @else {
          <main class="px-3 pb-8 max-w-3xl mx-auto">
            <div class="py-5">
              <h1 class="text-[22px] font-semibold text-fg tracking-tight">
                Usuarios de staff
              </h1>
              <p class="text-[13px] text-muted mt-0.5">
                {{ staff().length }} usuario{{ staff().length === 1 ? '' : 's' }}
                · {{ activeCount() }} activo{{ activeCount() === 1 ? '' : 's' }}
              </p>
            </div>

            @if (staff().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5"
                     class="text-muted opacity-30" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p class="text-muted text-sm">No hay usuarios de staff todavía.</p>
                <button
                  type="button"
                  (click)="openCreate()"
                  class="text-accent text-sm underline cursor-pointer bg-transparent border-0"
                >
                  Crear el primero
                </button>
              </div>
            } @else {
              <div class="space-y-2">
                @for (member of staff(); track member.id) {
                  <article
                    class="bg-surface border border-border rounded-lg overflow-hidden transition-opacity"
                    [class.opacity-60]="!member.is_active"
                    [attr.aria-label]="member.name + (member.is_active ? '' : ' — inactivo')"
                  >
                    <div class="p-4 flex items-center gap-3">

                      <!-- Avatar -->
                      <div
                        class="w-9 h-9 rounded-full bg-accent-soft flex items-center
                               justify-center shrink-0 font-semibold text-[14px] text-accent"
                        aria-hidden="true"
                      >
                        {{ member.name[0].toUpperCase() }}
                      </div>

                      <!-- Info -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-semibold text-[14px] text-fg leading-snug truncate">
                            {{ member.name }}
                          </span>
                          <!-- Role badge -->
                          <span
                            class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            [class.bg-success-soft]="member.role === 'kitchen'"
                            [class.text-success]="member.role === 'kitchen'"
                            [class.bg-warn-soft]="member.role === 'cashier'"
                            [class.text-warn]="member.role === 'cashier'"
                            [class.bg-accent-soft]="member.role === 'admin'"
                            [class.text-accent]="member.role === 'admin'"
                          >{{ roleLabel(member.role) }}</span>
                          <!-- Inactive badge -->
                          @if (!member.is_active) {
                            <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px]
                                         font-medium bg-border text-muted">
                              Inactivo
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Toggle button -->
                      <button
                        type="button"
                        (click)="toggleActive(member)"
                        [disabled]="togglingId() === member.id"
                        class="shrink-0 py-1.5 px-3 rounded-lg text-[12px] font-semibold
                               border cursor-pointer transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                        [class.border-success]="member.is_active"
                        [class.text-success]="member.is_active"
                        [class.bg-success-soft]="member.is_active"
                        [class.border-border]="!member.is_active"
                        [class.text-muted]="!member.is_active"
                        [class.bg-surface]="!member.is_active"
                        [attr.aria-label]="
                          (member.is_active ? 'Desactivar' : 'Activar')
                          + ' ' + member.name"
                      >
                        {{
                          togglingId() === member.id
                            ? '…'
                            : member.is_active ? 'Desactivar' : 'Activar'
                        }}
                      </button>
                    </div>
                  </article>
                }
              </div>
            }
          </main>
        }
      }

      <!-- ─── Form view ─────────────────────────────────────────────────── -->
      @if (view() === 'form') {
        <main class="px-3 pb-8 max-w-2xl mx-auto pt-4">

          @if (visibleErrors().length > 0) {
            <div role="alert" class="mb-4 p-3 bg-danger-soft rounded-lg">
              <ul class="list-none p-0 m-0 space-y-1">
                @for (err of visibleErrors(); track err) {
                  <li class="text-[13px] text-danger flex items-center gap-1.5">
                    <span aria-hidden="true">·</span>{{ err }}
                  </li>
                }
              </ul>
            </div>
          }

          @if (saveError()) {
            <div role="alert" class="mb-4 p-3 bg-danger-soft rounded-lg">
              <p class="text-[13px] text-danger">{{ saveError() }}</p>
            </div>
          }

          <!-- Section: Datos del usuario -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Datos del usuario
            </p>

            <label class="block mb-3">
              <span class="text-[13px] font-medium text-muted block mb-1">Nombre *</span>
              <input
                type="text"
                [value]="fName()"
                (input)="fName.set($any($event.target).value)"
                placeholder="Ej: María García"
                autocomplete="name"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
            </label>

            <label class="block mb-3">
              <span class="text-[13px] font-medium text-muted block mb-1">Email *</span>
              <input
                type="email"
                [value]="fEmail()"
                (input)="fEmail.set($any($event.target).value)"
                placeholder="staff@ejemplo.com"
                autocomplete="email"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
            </label>

            <label class="block">
              <span class="text-[13px] font-medium text-muted block mb-1">
                Contraseña temporal *
              </span>
              <input
                type="password"
                [value]="fPassword()"
                (input)="fPassword.set($any($event.target).value)"
                placeholder="Mín. 8 caracteres"
                autocomplete="new-password"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
              <span class="text-[12px] text-muted block mt-1">
                El usuario puede cambiarla desde Supabase Auth después del primer login.
              </span>
            </label>
          </div>

          <!-- Section: Rol -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Rol
            </p>

            <label class="block">
              <span class="text-[13px] font-medium text-muted block mb-1">Rol *</span>
              <select
                [value]="fRole()"
                (change)="fRole.set($any($event.target).value)"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       cursor-pointer"
              >
                <option value="kitchen">Cocina — ve pedidos en preparación</option>
                <option value="cashier">Caja — confirma pedidos y pagos</option>
                <option value="admin">Admin — acceso completo</option>
              </select>
            </label>
          </div>

        </main>
      }

    </div>
  `,
  styles: `:host { display: block; }`,
})
export class AdminUsersComponent implements OnInit {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ── List state ────────────────────────────────────────────────────────────
  readonly staff = signal<StaffMember[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly togglingId = signal<string | null>(null);

  // ── View state ────────────────────────────────────────────────────────────
  readonly view = signal<'list' | 'form'>('list');

  // ── Form fields ───────────────────────────────────────────────────────────
  readonly fName = signal('');
  readonly fEmail = signal('');
  readonly fPassword = signal('');
  readonly fRole = signal<StaffRole>('kitchen');

  // ── Form submit state ─────────────────────────────────────────────────────
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly triedSave = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly activeCount = computed(
    () => this.staff().filter(s => s.is_active).length,
  );

  readonly formErrors = computed(() => {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.fName().trim()) errors.push('El nombre es requerido.');
    if (!this.fEmail().trim() || !emailRegex.test(this.fEmail().trim()))
      errors.push('El email debe ser válido.');
    if (this.fPassword().length < 8)
      errors.push('La contraseña debe tener al menos 8 caracteres.');
    return errors;
  });

  readonly visibleErrors = computed(() =>
    this.triedSave() ? this.formErrors() : [],
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    try {
      const { data, error } = await this.supabase.client
        .from('staff')
        .select('id, name, role, is_active')
        .order('name');
      if (error) throw error;
      this.staff.set(data as StaffMember[]);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Form open/close ───────────────────────────────────────────────────────
  openCreate(): void {
    this.fName.set('');
    this.fEmail.set('');
    this.fPassword.set('');
    this.fRole.set('kitchen');
    this.saveError.set(null);
    this.triedSave.set(false);
    this.view.set('form');
  }

  cancelForm(): void {
    this.view.set('list');
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async saveForm(): Promise<void> {
    this.triedSave.set(true);
    if (this.formErrors().length > 0) return;

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const { data, error } = await this.supabase.client.functions.invoke(
        'create-staff-user',
        {
          body: {
            email: this.fEmail().trim(),
            password: this.fPassword(),
            name: this.fName().trim(),
            role: this.fRole(),
          },
        },
      );

      if (error) {
        // Try to extract the structured error from the HTTP response body.
        // FunctionsHttpError exposes the raw Response via .context.
        let message = 'Error al crear el usuario.';
        try {
          const ctx = (error as unknown as { context: Response }).context;
          if (ctx) {
            const body = (await ctx.json()) as { error?: string };
            if (body.error) message = body.error;
          } else if (error.message) {
            message = error.message;
          }
        } catch {
          if (error.message) message = error.message;
        }
        throw new Error(message);
      }

      const created = data as { id: string; name: string; role: StaffRole };
      this.staff.update(list =>
        [...list, { id: created.id, name: created.name, role: created.role, is_active: true }]
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      this.view.set('list');
    } catch (err) {
      this.saveError.set(
        err instanceof Error ? err.message : 'Error al crear el usuario.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async toggleActive(member: StaffMember): Promise<void> {
    this.togglingId.set(member.id);
    try {
      const { error } = await this.supabase.client
        .from('staff')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);
      if (!error) {
        this.staff.update(list =>
          list.map(s =>
            s.id === member.id ? { ...s, is_active: !s.is_active } : s,
          ),
        );
      }
    } finally {
      this.togglingId.set(null);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  roleLabel(role: StaffRole): string {
    return ROLE_LABELS[role];
  }

  goBack(): void {
    this.router.navigate(['/staff/admin']);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }
}
