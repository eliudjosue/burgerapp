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

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface DeactivationPending {
  category: AdminCategory;
  activeProductCount: number;
}

@Component({
  selector: 'app-admin-categories',
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
            <span class="font-semibold text-[15px]">Categorías</span>
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
              {{ editingCategory() ? 'Editar categoría' : 'Nueva categoría' }}
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
            Cargando categorías…
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
            <p class="text-sm text-muted">No se pudieron cargar las categorías.</p>
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
              <h1 class="text-[22px] font-semibold text-fg tracking-tight">Categorías</h1>
              <p class="text-[13px] text-muted mt-0.5">
                {{ categories().length }} categoría{{ categories().length === 1 ? '' : 's' }}
                · {{ activeCount() }} activa{{ activeCount() === 1 ? '' : 's' }}
              </p>
            </div>

            @if (categories().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5"
                     class="text-muted opacity-30" aria-hidden="true">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p class="text-muted text-sm">No hay categorías todavía.</p>
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
                @for (cat of categories(); track cat.id) {
                  <article
                    class="bg-surface border border-border rounded-lg overflow-hidden transition-opacity"
                    [class.opacity-60]="!cat.is_active"
                    [attr.aria-label]="cat.name + (cat.is_active ? '' : ' — inactiva')"
                  >
                    <!-- Deactivation warning banner -->
                    @if (pendingFor(cat.id); as pd) {
                      <div
                        role="alert"
                        class="px-4 py-3 bg-warn-soft border-b border-warn/20 flex
                               items-start gap-3"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2"
                             class="text-warn shrink-0 mt-0.5" aria-hidden="true">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <div class="flex-1 min-w-0">
                          <p class="text-[13px] font-semibold text-fg">
                            Esta categoría tiene
                            {{ pd.activeProductCount }}
                            producto{{ pd.activeProductCount === 1 ? '' : 's' }}
                            activo{{ pd.activeProductCount === 1 ? '' : 's' }}.
                          </p>
                          <p class="text-[12px] text-muted mt-0.5">
                            Los productos seguirán activos, pero la categoría no aparecerá
                            en el catálogo público hasta que la reactives.
                          </p>
                          <div class="flex items-center gap-2 mt-2.5">
                            <button
                              type="button"
                              (click)="confirmDeactivation()"
                              [disabled]="togglingId() === cat.id"
                              class="text-[12px] font-semibold px-3 py-1.5 rounded-lg
                                     bg-warn text-white border-0 cursor-pointer
                                     hover:opacity-90 transition-opacity
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Desactivar igual
                            </button>
                            <button
                              type="button"
                              (click)="cancelDeactivation()"
                              class="text-[12px] font-semibold px-3 py-1.5 rounded-lg
                                     border border-border bg-surface text-fg cursor-pointer
                                     hover:border-muted/50 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    }

                    <div class="p-4 flex items-center gap-3">
                      <!-- Sort order badge -->
                      <span class="font-mono text-[11px] text-muted w-6 shrink-0 text-center">
                        {{ cat.sort_order }}
                      </span>

                      <!-- Info -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-semibold text-[14px] text-fg leading-snug">
                            {{ cat.name }}
                          </span>
                          <span
                            class="shrink-0 px-2 py-0.5 rounded-full font-mono
                                   text-[10px] font-medium"
                            [class.bg-success-soft]="cat.is_active"
                            [class.text-success]="cat.is_active"
                            [class.bg-border]="!cat.is_active"
                            [class.text-muted]="!cat.is_active"
                          >{{ cat.is_active ? 'Activa' : 'Inactiva' }}</span>
                        </div>
                        @if (cat.description) {
                          <p class="text-[12px] text-muted mt-0.5 truncate">
                            {{ cat.description }}
                          </p>
                        }
                        <p class="text-[11px] text-muted/60 font-mono mt-0.5">
                          id: {{ cat.id }}
                        </p>
                      </div>

                      <!-- Actions -->
                      <div class="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          (click)="requestToggleActive(cat)"
                          [disabled]="togglingId() === cat.id || checkingDeactivation() === cat.id"
                          class="py-1.5 px-3 rounded-lg text-[12px] font-semibold
                                 border cursor-pointer transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                          [class.border-success]="cat.is_active"
                          [class.text-success]="cat.is_active"
                          [class.bg-success-soft]="cat.is_active"
                          [class.border-border]="!cat.is_active"
                          [class.text-muted]="!cat.is_active"
                          [class.bg-surface]="!cat.is_active"
                          [attr.aria-label]="
                            (cat.is_active ? 'Desactivar' : 'Activar')
                            + ' ' + cat.name"
                        >
                          {{
                            checkingDeactivation() === cat.id
                              ? '…'
                              : togglingId() === cat.id
                                ? '…'
                                : cat.is_active ? 'Desactivar' : 'Activar'
                          }}
                        </button>
                        <button
                          type="button"
                          (click)="openEdit(cat)"
                          class="py-1.5 px-4 rounded-lg text-[12px] font-semibold
                                 border border-border bg-surface text-fg cursor-pointer
                                 hover:border-muted/50 transition-colors"
                          [attr.aria-label]="'Editar ' + cat.name"
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

          <!-- Validation errors -->
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

          <!-- Save error -->
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
                placeholder="Ej: Hamburguesas"
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
            </label>

            <label class="block">
              <span class="text-[13px] font-medium text-muted block mb-1">Descripción</span>
              <textarea
                [value]="fDesc()"
                (input)="fDesc.set($any($event.target).value)"
                rows="2"
                placeholder="Ej: Hamburguesas de la casa"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       resize-none leading-relaxed"
              ></textarea>
            </label>
          </div>

          <!-- Section: Orden y estado -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Orden y estado
            </p>

            <label class="block mb-4">
              <span class="text-[13px] font-medium text-muted block mb-1">
                Orden de aparición
              </span>
              <input
                type="number"
                min="0"
                step="1"
                [value]="fSortOrder()"
                (input)="fSortOrder.set($any($event.target).value)"
                placeholder="0"
                class="w-32 text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       font-mono"
              />
              <span class="text-[12px] text-muted block mt-1">
                Las categorías se ordenan de menor a mayor.
              </span>
            </label>

            <!-- is_active toggle -->
            <div class="flex items-start justify-between gap-4">
              <div id="toggle-cat-active-label">
                <span class="text-[14px] font-medium text-fg block">Categoría activa</span>
                <span class="text-[12px] text-muted">
                  Las inactivas no aparecen en el catálogo público
                </span>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="fIsActive()"
                aria-labelledby="toggle-cat-active-label"
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
export class AdminCategoriesComponent implements OnInit {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ── List state ────────────────────────────────────────────────────────────
  readonly categories = signal<AdminCategory[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly togglingId = signal<string | null>(null);
  readonly checkingDeactivation = signal<string | null>(null);
  readonly pendingDeactivation = signal<DeactivationPending | null>(null);

  // ── View state ────────────────────────────────────────────────────────────
  readonly view = signal<'list' | 'form'>('list');
  readonly editingCategory = signal<AdminCategory | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  readonly fName = signal('');
  readonly fDesc = signal('');
  readonly fSortOrder = signal('0');
  readonly fIsActive = signal(true);

  // ── Form submit state ─────────────────────────────────────────────────────
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly triedSave = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly activeCount = computed(
    () => this.categories().filter(c => c.is_active).length,
  );

  readonly formErrors = computed(() => {
    const errors: string[] = [];
    if (!this.fName().trim()) errors.push('El nombre es requerido.');
    const order = parseInt(this.fSortOrder(), 10);
    if (isNaN(order) || order < 0)
      errors.push('El orden debe ser un número mayor o igual a 0.');
    return errors;
  });

  readonly visibleErrors = computed(() =>
    this.triedSave() ? this.formErrors() : [],
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.pendingDeactivation.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .select('id, name, description, sort_order, is_active')
        .order('sort_order')
        .order('name');
      if (error) throw error;
      this.categories.set(data as AdminCategory[]);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Form open/close ───────────────────────────────────────────────────────
  openCreate(): void {
    this.editingCategory.set(null);
    this.fName.set('');
    this.fDesc.set('');
    this.fSortOrder.set(this.nextSortOrderDefault());
    this.fIsActive.set(true);
    this.saveError.set(null);
    this.triedSave.set(false);
    this.view.set('form');
  }

  openEdit(category: AdminCategory): void {
    this.editingCategory.set(category);
    this.fName.set(category.name);
    this.fDesc.set(category.description ?? '');
    this.fSortOrder.set(String(category.sort_order));
    this.fIsActive.set(category.is_active);
    this.saveError.set(null);
    this.triedSave.set(false);
    this.view.set('form');
  }

  cancelForm(): void {
    this.view.set('list');
    this.editingCategory.set(null);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async saveForm(): Promise<void> {
    this.triedSave.set(true);
    if (this.formErrors().length > 0) return;

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const editing = this.editingCategory();
      const payload = {
        name: this.fName().trim(),
        description: this.fDesc().trim() || null,
        sort_order: parseInt(this.fSortOrder(), 10),
        is_active: this.fIsActive(),
      };

      if (editing === null) {
        const id = slugify(payload.name);
        const { data, error } = await this.supabase.client
          .from('categories')
          .insert({ id, ...payload })
          .select('id, name, description, sort_order, is_active')
          .single();
        if (error) {
          if (error.code === '23505') {
            this.saveError.set(
              'Ya existe una categoría con un nombre muy similar. Elegí un nombre diferente.',
            );
          } else {
            throw error;
          }
          return;
        }
        this.categories.update(cs =>
          [...cs, data as AdminCategory].sort(sortCategories),
        );
      } else {
        const { error } = await this.supabase.client
          .from('categories')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        const updated: AdminCategory = { ...editing, ...payload };
        this.categories.update(cs =>
          cs.map(c => (c.id === editing.id ? updated : c)).sort(sortCategories),
        );
      }

      this.view.set('list');
      this.editingCategory.set(null);
    } catch (err) {
      this.saveError.set(
        err instanceof Error ? err.message : 'Error al guardar la categoría.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async requestToggleActive(category: AdminCategory): Promise<void> {
    // Activating never needs a warning.
    if (!category.is_active) {
      await this.doToggle(category);
      return;
    }

    // Deactivating: check for active products first.
    this.checkingDeactivation.set(category.id);
    this.pendingDeactivation.set(null);
    try {
      const { count, error } = await this.supabase.client
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('is_active', true);
      if (error) throw error;
      const activeProductCount = count ?? 0;
      if (activeProductCount > 0) {
        this.pendingDeactivation.set({ category, activeProductCount });
      } else {
        await this.doToggle(category);
      }
    } catch {
      // Silent: fall through and let the toggle try anyway.
      await this.doToggle(category);
    } finally {
      this.checkingDeactivation.set(null);
    }
  }

  async confirmDeactivation(): Promise<void> {
    const pending = this.pendingDeactivation();
    if (!pending) return;
    this.pendingDeactivation.set(null);
    await this.doToggle(pending.category);
  }

  cancelDeactivation(): void {
    this.pendingDeactivation.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  pendingFor(catId: string): DeactivationPending | null {
    const pd = this.pendingDeactivation();
    return pd?.category.id === catId ? pd : null;
  }

  goBack(): void {
    this.router.navigate(['/staff/admin']);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }

  private async doToggle(category: AdminCategory): Promise<void> {
    this.togglingId.set(category.id);
    try {
      const { error } = await this.supabase.client
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);
      if (!error) {
        this.categories.update(cs =>
          cs.map(c =>
            c.id === category.id ? { ...c, is_active: !c.is_active } : c,
          ),
        );
      }
    } finally {
      this.togglingId.set(null);
    }
  }

  private nextSortOrderDefault(): string {
    const cats = this.categories();
    if (cats.length === 0) return '0';
    return String(Math.max(...cats.map(c => c.sort_order)) + 10);
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

function sortCategories(a: AdminCategory, b: AdminCategory): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.name.localeCompare(b.name);
}
