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

export interface AdminDeliveryZone {
  id: string;
  name: string;
  cost: number;
  is_active: boolean;
  sort_order: number;
}

@Component({
  selector: 'app-admin-delivery-zones',
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
            <span class="font-semibold text-[15px]">Zonas de delivery</span>
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
              Nueva
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
            <span class="font-semibold text-[15px]">
              {{ editingZone() ? 'Editar zona' : 'Nueva zona' }}
            </span>
          </div>
          <button
            type="button"
            (click)="saveForm()"
            [disabled]="saving()"
            class="bg-accent text-white text-[12px] font-semibold px-3 py-1.5
                   rounded-lg border-0 cursor-pointer hover:opacity-90 transition-opacity
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Guardando…' : 'Guardar' }}
          </button>
        }
      </header>

      <!-- ─── List view ─────────────────────────────────────────────────── -->
      @if (view() === 'list') {

        @if (isLoading()) {
          <div class="flex items-center justify-center h-48 text-muted text-sm">
            Cargando zonas…
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
            <p class="text-sm text-muted">No se pudieron cargar las zonas de delivery.</p>
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
                Zonas de delivery
              </h1>
              <p class="text-[13px] text-muted mt-0.5">
                {{ zones().length }} zona{{ zones().length === 1 ? '' : 's' }}
                · {{ activeCount() }} activa{{ activeCount() === 1 ? '' : 's' }}
              </p>
            </div>

            @if (zones().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5"
                     class="text-muted opacity-30" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                <p class="text-muted text-sm">No hay zonas de delivery todavía.</p>
                <button
                  type="button"
                  (click)="openCreate()"
                  class="text-accent text-sm underline cursor-pointer bg-transparent border-0"
                >
                  Crear la primera
                </button>
              </div>
            } @else {
              <div class="space-y-2">
                @for (zone of zones(); track zone.id) {
                  <article
                    class="bg-surface border border-border rounded-lg overflow-hidden
                           transition-opacity"
                    [class.opacity-60]="!zone.is_active"
                    [attr.aria-label]="zone.name + (zone.is_active ? '' : ' — inactiva')"
                  >
                    <div class="p-4 flex items-center gap-3">

                      <!-- Info -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-semibold text-[14px] text-fg leading-snug">
                            {{ zone.name }}
                          </span>
                          <span
                            class="shrink-0 px-2 py-0.5 rounded-full font-mono
                                   text-[10px] font-medium"
                            [class.bg-success-soft]="zone.is_active"
                            [class.text-success]="zone.is_active"
                            [class.bg-border]="!zone.is_active"
                            [class.text-muted]="!zone.is_active"
                          >{{ zone.is_active ? 'Activa' : 'Inactiva' }}</span>
                        </div>
                        <div class="text-[18px] font-semibold font-mono tabular-nums
                                    text-accent mt-0.5">
                          {{ formatCurrency(zone.cost) }}
                        </div>
                        <p class="text-[11px] text-muted/60 font-mono mt-0.5">
                          id: {{ zone.id }}
                        </p>
                      </div>

                      <!-- Actions -->
                      <div class="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          (click)="toggleActive(zone)"
                          [disabled]="togglingId() === zone.id"
                          class="py-1.5 px-3 rounded-lg text-[12px] font-semibold
                                 border cursor-pointer transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                          [class.border-success]="zone.is_active"
                          [class.text-success]="zone.is_active"
                          [class.bg-success-soft]="zone.is_active"
                          [class.border-border]="!zone.is_active"
                          [class.text-muted]="!zone.is_active"
                          [class.bg-surface]="!zone.is_active"
                          [attr.aria-label]="
                            (zone.is_active ? 'Desactivar' : 'Activar')
                            + ' ' + zone.name"
                        >
                          {{
                            togglingId() === zone.id
                              ? '…'
                              : zone.is_active ? 'Desactivar' : 'Activar'
                          }}
                        </button>
                        <button
                          type="button"
                          (click)="openEdit(zone)"
                          class="py-1.5 px-4 rounded-lg text-[12px] font-semibold
                                 border border-border bg-surface text-fg cursor-pointer
                                 hover:border-muted/50 transition-colors"
                          [attr.aria-label]="'Editar ' + zone.name"
                        >
                          Editar
                        </button>
                      </div>
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

          <!-- Section: Datos básicos -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Datos básicos
            </p>

            <label class="block mb-3">
              <span class="text-[13px] font-medium text-muted block mb-1">Nombre *</span>
              <input
                type="text"
                [value]="fName()"
                (input)="fName.set($any($event.target).value)"
                placeholder="Ej: Centro"
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
              @if (editingZone()) {
                <span class="text-[11px] text-muted/60 font-mono mt-1 block">
                  id: {{ editingZone()!.id }} (inmutable)
                </span>
              }
            </label>

            <label class="block">
              <span class="text-[13px] font-medium text-muted block mb-1">
                Costo de envío (ARS) *
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                [value]="fCost()"
                (input)="fCost.set($any($event.target).value)"
                placeholder="0"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       font-mono"
              />
              <span class="text-[12px] text-muted block mt-1">
                Ingresá 0 si el envío es sin cargo.
              </span>
            </label>
          </div>

          <!-- Section: Estado -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Estado
            </p>

            <div class="flex items-start justify-between gap-4">
              <div id="toggle-zone-active-label">
                <span class="text-[14px] font-medium text-fg block">Zona activa</span>
                <span class="text-[12px] text-muted">
                  Las inactivas no aparecen como opción en el checkout público
                </span>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="fIsActive()"
                aria-labelledby="toggle-zone-active-label"
                (click)="fIsActive.update(v => !v)"
                class="relative shrink-0 h-6 w-11 rounded-full transition-colors
                       cursor-pointer border-0 mt-0.5 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-accent"
                [class.bg-success]="fIsActive()"
                [class.bg-[#d1cfc8]]="!fIsActive()"
              >
                <span class="sr-only">{{ fIsActive() ? 'Activa' : 'Inactiva' }}</span>
                <span
                  aria-hidden="true"
                  class="absolute top-1 left-1 h-4 w-4 rounded-full bg-white
                         shadow-sm transition-transform"
                  [class.translate-x-5]="fIsActive()"
                ></span>
              </button>
            </div>
          </div>

        </main>
      }

    </div>
  `,
  styles: `:host { display: block; }`,
})
export class AdminDeliveryZonesComponent implements OnInit {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ── List state ────────────────────────────────────────────────────────────
  readonly zones = signal<AdminDeliveryZone[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly togglingId = signal<string | null>(null);

  // ── View state ────────────────────────────────────────────────────────────
  readonly view = signal<'list' | 'form'>('list');
  readonly editingZone = signal<AdminDeliveryZone | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  readonly fName = signal('');
  readonly fCost = signal('0');
  readonly fIsActive = signal(true);

  // ── Form submit state ─────────────────────────────────────────────────────
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly triedSave = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly activeCount = computed(
    () => this.zones().filter(z => z.is_active).length,
  );

  readonly formErrors = computed(() => {
    const errors: string[] = [];
    if (!this.fName().trim()) errors.push('El nombre es requerido.');
    const cost = parseFloat(this.fCost());
    if (isNaN(cost) || cost < 0)
      errors.push('El costo debe ser 0 o mayor.');
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
        .from('delivery_zones')
        .select('id, name, cost, is_active, sort_order')
        .order('sort_order')
        .order('name');
      if (error) throw error;
      this.zones.set(data as AdminDeliveryZone[]);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Form open/close ───────────────────────────────────────────────────────
  openCreate(): void {
    this.editingZone.set(null);
    this.fName.set('');
    this.fCost.set('0');
    this.fIsActive.set(true);
    this.saveError.set(null);
    this.triedSave.set(false);
    this.view.set('form');
  }

  openEdit(zone: AdminDeliveryZone): void {
    this.editingZone.set(zone);
    this.fName.set(zone.name);
    this.fCost.set(String(zone.cost));
    this.fIsActive.set(zone.is_active);
    this.saveError.set(null);
    this.triedSave.set(false);
    this.view.set('form');
  }

  cancelForm(): void {
    this.view.set('list');
    this.editingZone.set(null);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async saveForm(): Promise<void> {
    this.triedSave.set(true);
    if (this.formErrors().length > 0) return;

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const editing = this.editingZone();
      const payload = {
        name: this.fName().trim(),
        cost: parseFloat(this.fCost()),
        is_active: this.fIsActive(),
      };

      if (editing === null) {
        const id = slugify(payload.name);
        const { data, error } = await this.supabase.client
          .from('delivery_zones')
          .insert({ id, ...payload })
          .select('id, name, cost, is_active, sort_order')
          .single();
        if (error) {
          if (error.code === '23505') {
            this.saveError.set(
              'Ya existe una zona con un nombre muy similar. Elegí un nombre diferente.',
            );
          } else {
            throw error;
          }
          return;
        }
        this.zones.update(zs =>
          [...zs, data as AdminDeliveryZone].sort(sortZones),
        );
      } else {
        const { error } = await this.supabase.client
          .from('delivery_zones')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        const updated: AdminDeliveryZone = { ...editing, ...payload };
        this.zones.update(zs =>
          zs.map(z => (z.id === editing.id ? updated : z)).sort(sortZones),
        );
      }

      this.view.set('list');
      this.editingZone.set(null);
    } catch (err) {
      this.saveError.set(
        err instanceof Error ? err.message : 'Error al guardar la zona.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async toggleActive(zone: AdminDeliveryZone): Promise<void> {
    this.togglingId.set(zone.id);
    try {
      const { error } = await this.supabase.client
        .from('delivery_zones')
        .update({ is_active: !zone.is_active })
        .eq('id', zone.id);
      if (!error) {
        this.zones.update(zs =>
          zs.map(z =>
            z.id === zone.id ? { ...z, is_active: !z.is_active } : z,
          ),
        );
      }
    } finally {
      this.togglingId.set(null);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatCurrency(amount: number): string {
    return '$' + new Intl.NumberFormat('es-AR').format(amount);
  }

  goBack(): void {
    this.router.navigate(['/staff/admin']);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function sortZones(a: AdminDeliveryZone, b: AdminDeliveryZone): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.name.localeCompare(b.name);
}
