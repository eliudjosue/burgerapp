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
import { StorageService } from '../../../../core/services/storage.service';

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string | null;
  is_active: boolean;
  is_combo: boolean;
  sort_order: number;
}

export interface AdminCategory {
  id: string;
  name: string;
}

interface ComboItemDraft {
  localId: number;
  product_id: string;
  quantity: number;
}

@Component({
  selector: 'app-admin-products',
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
            <span class="font-semibold text-[15px]">Productos</span>
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
            <span class="font-semibold text-[15px]">
              {{ editingProduct() ? 'Editar producto' : 'Nuevo producto' }}
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
            Cargando productos…
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
            <p class="text-sm text-muted">No se pudo cargar el catálogo.</p>
            <button
              type="button"
              (click)="ngOnInit()"
              class="text-xs text-accent underline cursor-pointer bg-transparent border-0 mt-1"
            >
              Reintentar
            </button>
          </div>
        } @else {
          <main class="px-3 pb-8 max-w-5xl mx-auto">
            <div class="py-5">
              <h1 class="text-[22px] font-semibold text-fg tracking-tight">Catálogo</h1>
              <p class="text-[13px] text-muted mt-0.5">
                {{ products().length }} producto{{ products().length === 1 ? '' : 's' }}
                · {{ activeCount() }} activo{{ activeCount() === 1 ? '' : 's' }}
              </p>
            </div>

            @if (products().length === 0) {
              <div class="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5"
                     class="text-muted opacity-30" aria-hidden="true">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <p class="text-muted text-sm">No hay productos todavía.</p>
                <button
                  type="button"
                  (click)="openCreate()"
                  class="text-accent text-sm underline cursor-pointer bg-transparent border-0"
                >
                  Crear el primero
                </button>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                @for (product of products(); track product.id) {
                  <article
                    class="bg-surface border border-border rounded-lg overflow-hidden
                           transition-opacity"
                    [class.opacity-60]="!product.is_active"
                    [attr.aria-label]="product.name + (product.is_active ? '' : ' — inactivo')"
                  >
                    <!-- Image -->
                    <div class="aspect-[16/10] bg-border/30 overflow-hidden">
                      @if (product.image_url) {
                        <img
                          [src]="product.image_url"
                          [alt]="product.name"
                          class="w-full h-full object-cover"
                          loading="lazy"
                        />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" stroke-width="1.5"
                               class="text-muted opacity-30" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-5-5L5 21"/>
                          </svg>
                        </div>
                      }
                    </div>

                    <!-- Body -->
                    <div class="p-3">
                      <div class="flex items-start gap-2 justify-between mb-1.5">
                        <span class="font-semibold text-[14px] leading-snug text-fg">
                          {{ product.name }}
                        </span>
                        <span
                          class="shrink-0 px-2 py-0.5 rounded-full font-mono
                                 text-[10px] font-medium"
                          [class.bg-success-soft]="product.is_active"
                          [class.text-success]="product.is_active"
                          [class.bg-border]="!product.is_active"
                          [class.text-muted]="!product.is_active"
                        >{{ product.is_active ? 'Activo' : 'Inactivo' }}</span>
                      </div>

                      <div class="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        @if (product.is_combo) {
                          <span class="px-2 py-0.5 rounded-full bg-accent-soft
                                       text-accent font-mono text-[10px]">
                            Combo
                          </span>
                        }
                        <span class="text-[11px] text-muted">
                          {{ categoryName(product.category_id) }}
                        </span>
                      </div>

                      <div class="text-[18px] font-semibold font-mono tabular-nums
                                  text-accent mb-3">
                        {{ formatCurrency(product.price) }}
                      </div>

                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="toggleActive(product)"
                          [disabled]="togglingId() === product.id"
                          class="flex-1 py-1.5 rounded-lg text-[12px] font-semibold
                                 border cursor-pointer transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                          [class.border-success]="product.is_active"
                          [class.text-success]="product.is_active"
                          [class.bg-success-soft]="product.is_active"
                          [class.border-border]="!product.is_active"
                          [class.text-muted]="!product.is_active"
                          [class.bg-surface]="!product.is_active"
                          [attr.aria-label]="
                            (product.is_active ? 'Desactivar' : 'Activar')
                            + ' ' + product.name"
                        >
                          {{
                            togglingId() === product.id
                              ? '…'
                              : product.is_active ? 'Desactivar' : 'Activar'
                          }}
                        </button>
                        <button
                          type="button"
                          (click)="openEdit(product)"
                          class="py-1.5 px-4 rounded-lg text-[12px] font-semibold
                                 border border-border bg-surface text-fg cursor-pointer
                                 hover:border-muted/50 transition-colors"
                          [attr.aria-label]="'Editar ' + product.name"
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
            <div
              role="alert"
              class="mb-4 p-3 bg-danger-soft rounded-lg"
            >
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
                placeholder="Ej: Hamburguesa Clásica"
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
            </label>

            <label class="block">
              <span class="text-[13px] font-medium text-muted block mb-1">Descripción *</span>
              <textarea
                [value]="fDesc()"
                (input)="fDesc.set($any($event.target).value)"
                rows="3"
                placeholder="Ej: Medallón de res, lechuga, tomate y salsa especial"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       resize-none leading-relaxed"
              ></textarea>
            </label>
          </div>

          <!-- Section: Precio y categoría -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Precio y categoría
            </p>
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-[13px] font-medium text-muted block mb-1">Precio (ARS) *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  [value]="fPrice()"
                  (input)="fPrice.set($any($event.target).value)"
                  placeholder="0"
                  class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                         font-mono"
                />
              </label>
              <label class="block">
                <span class="text-[13px] font-medium text-muted block mb-1">Categoría *</span>
                <select
                  (change)="fCategoryId.set($any($event.target).value)"
                  class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
                >
                  <option value="" [selected]="!fCategoryId()">Elegir…</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id" [selected]="fCategoryId() === cat.id">
                      {{ cat.name }}
                    </option>
                  }
                </select>
              </label>
            </div>
          </div>

          <!-- Section: Imagen -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Imagen del producto
            </p>

            @if (fImageUrl()) {
              <div class="relative mb-3 rounded-lg overflow-hidden">
                <img
                  [src]="fImageUrl()"
                  alt="Vista previa del producto"
                  class="w-full max-h-52 object-cover"
                />
                <button
                  type="button"
                  (click)="fImageUrl.set(null)"
                  class="absolute top-2 right-2 w-7 h-7 rounded-full
                         bg-[rgba(28,26,23,0.7)] text-white flex items-center
                         justify-center cursor-pointer border-0
                         hover:bg-[rgba(28,26,23,0.9)] transition-colors"
                  aria-label="Quitar imagen"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            } @else {
              <label class="block" [class.opacity-50]="uploadingImage()">
                <span class="sr-only">Elegir imagen del producto</span>
                <input
                  #imageInput
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onImageSelected($event)"
                  [disabled]="uploadingImage()"
                  class="block text-[13px] text-muted cursor-pointer w-full
                         file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                         file:text-[12px] file:font-semibold file:bg-accent file:text-white
                         file:cursor-pointer hover:file:opacity-90"
                />
              </label>
              <p class="text-[11px] text-muted mt-1.5">JPG, PNG o WebP · máx. 2 MB</p>
            }

            @if (uploadingImage()) {
              <p class="text-[13px] text-muted mt-2">Subiendo imagen…</p>
            }
            @if (uploadImageError()) {
              <p class="text-[13px] text-danger mt-2" role="alert">
                {{ uploadImageError() }}
              </p>
            }
          </div>

          <!-- Section: Estado -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Estado
            </p>

            <!-- is_active -->
            <div class="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
              <div id="toggle-active-label">
                <span class="text-[14px] font-medium text-fg block">
                  Producto activo
                </span>
                <span class="text-[12px] text-muted">
                  Los inactivos no aparecen en el catálogo público
                </span>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="fIsActive()"
                aria-labelledby="toggle-active-label"
                (click)="fIsActive.update(v => !v)"
                class="relative shrink-0 h-6 w-11 rounded-full transition-colors
                       cursor-pointer border-0 mt-0.5 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-accent"
                [class.bg-success]="fIsActive()"
                [class.bg-[#d1cfc8]]="!fIsActive()"
              >
                <span class="sr-only">{{ fIsActive() ? 'Activo' : 'Inactivo' }}</span>
                <span
                  aria-hidden="true"
                  class="absolute top-1 left-1 h-4 w-4 rounded-full bg-white
                         shadow-sm transition-transform"
                  [class.translate-x-5]="fIsActive()"
                ></span>
              </button>
            </div>

            <!-- is_combo -->
            <div class="flex items-start justify-between gap-4 pt-4">
              <div id="toggle-combo-label">
                <span class="text-[14px] font-medium text-fg block">Es un combo</span>
                <span class="text-[12px] text-muted">
                  Permite definir qué productos componen este combo
                </span>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="fIsCombo()"
                aria-labelledby="toggle-combo-label"
                (click)="toggleIsCombo()"
                class="relative shrink-0 h-6 w-11 rounded-full transition-colors
                       cursor-pointer border-0 mt-0.5 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-accent"
                [class.bg-accent]="fIsCombo()"
                [class.bg-[#d1cfc8]]="!fIsCombo()"
              >
                <span class="sr-only">{{ fIsCombo() ? 'Es combo' : 'No es combo' }}</span>
                <span
                  aria-hidden="true"
                  class="absolute top-1 left-1 h-4 w-4 rounded-full bg-white
                         shadow-sm transition-transform"
                  [class.translate-x-5]="fIsCombo()"
                ></span>
              </button>
            </div>
          </div>

          <!-- Section: Composición del combo (conditional) -->
          @if (fIsCombo()) {
            <div class="bg-surface border border-border rounded-lg p-4 mb-3">
              <div class="flex items-center justify-between mb-4">
                <p class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                  Composición del combo
                </p>
                <button
                  type="button"
                  (click)="addComboItem()"
                  class="text-[12px] font-semibold text-accent border border-accent/30
                         bg-accent-soft px-2.5 py-1 rounded-lg cursor-pointer
                         hover:opacity-80 transition-opacity"
                >
                  + Agregar ítem
                </button>
              </div>

              @if (loadingComboItems()) {
                <p class="text-[13px] text-muted">Cargando composición…</p>
              } @else if (fComboItems().length === 0) {
                <p class="text-[13px] text-muted">
                  Sin ítems. Usá "+ Agregar ítem" para componer el combo.
                </p>
              } @else {
                <div class="space-y-2">
                  @for (item of fComboItems(); track item.localId; let i = $index) {
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[12px] text-muted w-5 shrink-0 text-right">
                        {{ i + 1 }}.
                      </span>
                      <select
                        (change)="updateComboItemProduct(item.localId, $any($event.target).value)"
                        class="flex-1 text-[13px] px-2.5 py-2 rounded-lg border border-border
                               focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
                        [attr.aria-label]="'Producto del ítem ' + (i + 1)"
                      >
                        <option value="" [selected]="!item.product_id">
                          Elegir producto…
                        </option>
                        @for (p of nonComboProducts(); track p.id) {
                          <option [value]="p.id" [selected]="item.product_id === p.id">
                            {{ p.name }}
                          </option>
                        }
                      </select>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        [value]="item.quantity"
                        (input)="updateComboItemQty(item.localId, +$any($event.target).value)"
                        class="w-16 text-[13px] px-2 py-2 rounded-lg border border-border
                               focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                               text-center font-mono"
                        [attr.aria-label]="'Cantidad del ítem ' + (i + 1)"
                      />
                      <button
                        type="button"
                        (click)="removeComboItem(item.localId)"
                        class="p-1.5 rounded-lg text-muted hover:text-danger cursor-pointer
                               bg-transparent border-0 transition-colors"
                        [attr.aria-label]="'Eliminar ítem ' + (i + 1)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                          <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }

        </main>
      }

    </div>
  `,
  styles: `:host { display: block; }`,
})
export class AdminProductsComponent implements OnInit {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);

  // ── List state ────────────────────────────────────────────────────────────
  readonly products = signal<AdminProduct[]>([]);
  readonly categories = signal<AdminCategory[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly togglingId = signal<string | null>(null);

  // ── View state ────────────────────────────────────────────────────────────
  readonly view = signal<'list' | 'form'>('list');
  readonly editingProduct = signal<AdminProduct | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  readonly fName = signal('');
  readonly fDesc = signal('');
  readonly fPrice = signal('');
  readonly fCategoryId = signal('');
  readonly fIsActive = signal(true);
  readonly fIsCombo = signal(false);
  readonly fImageUrl = signal<string | null>(null);

  // ── Combo items ───────────────────────────────────────────────────────────
  readonly fComboItems = signal<ComboItemDraft[]>([]);
  readonly loadingComboItems = signal(false);

  // ── Form submit state ─────────────────────────────────────────────────────
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly triedSave = signal(false);

  // ── Image upload state ────────────────────────────────────────────────────
  readonly uploadingImage = signal(false);
  readonly uploadImageError = signal<string | null>(null);

  private nextLocalId = 0;

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly activeCount = computed(
    () => this.products().filter(p => p.is_active).length,
  );

  readonly nonComboProducts = computed(() =>
    this.products().filter(
      p => !p.is_combo && p.id !== (this.editingProduct()?.id ?? ''),
    ),
  );

  readonly formErrors = computed(() => {
    const errors: string[] = [];
    if (!this.fName().trim()) errors.push('El nombre es requerido.');
    if (!this.fDesc().trim()) errors.push('La descripción es requerida.');
    const price = parseFloat(this.fPrice());
    if (isNaN(price) || price <= 0)
      errors.push('El precio debe ser mayor a 0.');
    if (!this.fCategoryId()) errors.push('Seleccioná una categoría.');
    if (this.fIsCombo()) {
      if (this.fComboItems().length === 0)
        errors.push('Un combo debe tener al menos un producto.');
      else if (this.fComboItems().some(ci => !ci.product_id || ci.quantity < 1))
        errors.push('Completá todos los ítems del combo.');
    }
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
      const [prodResult, catResult] = await Promise.all([
        this.supabase.client
          .from('products')
          .select('id, name, description, price, category_id, image_url, is_active, is_combo, sort_order')
          .order('sort_order')
          .order('name'),
        this.supabase.client
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('sort_order'),
      ]);
      if (prodResult.error) throw prodResult.error;
      if (catResult.error) throw catResult.error;
      this.products.set(prodResult.data as AdminProduct[]);
      this.categories.set(catResult.data as AdminCategory[]);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Form open/close ───────────────────────────────────────────────────────
  openCreate(): void {
    this.editingProduct.set(null);
    this.fName.set('');
    this.fDesc.set('');
    this.fPrice.set('');
    this.fCategoryId.set('');
    this.fIsActive.set(true);
    this.fIsCombo.set(false);
    this.fImageUrl.set(null);
    this.fComboItems.set([]);
    this.saveError.set(null);
    this.uploadImageError.set(null);
    this.triedSave.set(false);
    this.view.set('form');
  }

  async openEdit(product: AdminProduct): Promise<void> {
    this.editingProduct.set(product);
    this.fName.set(product.name);
    this.fDesc.set(product.description);
    this.fPrice.set(String(product.price));
    this.fCategoryId.set(product.category_id);
    this.fIsActive.set(product.is_active);
    this.fIsCombo.set(product.is_combo);
    this.fImageUrl.set(product.image_url);
    this.fComboItems.set([]);
    this.saveError.set(null);
    this.uploadImageError.set(null);
    this.triedSave.set(false);
    this.view.set('form');

    if (product.is_combo) {
      await this.loadComboItems(product.id);
    }
  }

  cancelForm(): void {
    this.view.set('list');
    this.editingProduct.set(null);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async saveForm(): Promise<void> {
    this.triedSave.set(true);
    if (this.formErrors().length > 0) return;

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const payload = {
        name: this.fName().trim(),
        description: this.fDesc().trim(),
        price: parseFloat(this.fPrice()),
        category_id: this.fCategoryId(),
        is_active: this.fIsActive(),
        is_combo: this.fIsCombo(),
        image_url: this.fImageUrl(),
      };

      const editing = this.editingProduct();

      if (editing === null) {
        // ── Create ──────────────────────────────────────────────────────────
        const { data, error } = await this.supabase.client
          .from('products')
          .insert(payload)
          .select('id, name, description, price, category_id, image_url, is_active, is_combo, sort_order')
          .single();
        if (error) throw error;

        const created = data as AdminProduct;

        if (this.fIsCombo() && this.fComboItems().length > 0) {
          const { error: ciErr } = await this.supabase.client
            .from('combo_items')
            .insert(
              this.fComboItems().map(ci => ({
                combo_id: created.id,
                product_id: ci.product_id,
                quantity: ci.quantity,
              })),
            );
          if (ciErr) throw ciErr;
        }

        this.products.update(ps => [created, ...ps]);
      } else {
        // ── Update ──────────────────────────────────────────────────────────
        const { error } = await this.supabase.client
          .from('products')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;

        // Replace combo items unconditionally (cleans up if combo was toggled off).
        const { error: delErr } = await this.supabase.client
          .from('combo_items')
          .delete()
          .eq('combo_id', editing.id);
        if (delErr) throw delErr;

        if (this.fIsCombo() && this.fComboItems().length > 0) {
          const { error: ciErr } = await this.supabase.client
            .from('combo_items')
            .insert(
              this.fComboItems().map(ci => ({
                combo_id: editing.id,
                product_id: ci.product_id,
                quantity: ci.quantity,
              })),
            );
          if (ciErr) throw ciErr;
        }

        const updated: AdminProduct = { ...editing, ...payload };
        this.products.update(ps =>
          ps.map(p => (p.id === editing.id ? updated : p)),
        );
      }

      this.view.set('list');
      this.editingProduct.set(null);
    } catch (err) {
      this.saveError.set(
        err instanceof Error ? err.message : 'Error al guardar el producto.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async toggleActive(product: AdminProduct): Promise<void> {
    this.togglingId.set(product.id);
    try {
      const { error } = await this.supabase.client
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);
      if (!error) {
        this.products.update(ps =>
          ps.map(p =>
            p.id === product.id ? { ...p, is_active: !p.is_active } : p,
          ),
        );
      }
    } finally {
      this.togglingId.set(null);
    }
  }

  // ── Combo items mutations ─────────────────────────────────────────────────
  addComboItem(): void {
    this.fComboItems.update(items => [
      ...items,
      { localId: ++this.nextLocalId, product_id: '', quantity: 1 },
    ]);
  }

  removeComboItem(localId: number): void {
    this.fComboItems.update(items =>
      items.filter(ci => ci.localId !== localId),
    );
  }

  updateComboItemProduct(localId: number, product_id: string): void {
    this.fComboItems.update(items =>
      items.map(ci => (ci.localId === localId ? { ...ci, product_id } : ci)),
    );
  }

  updateComboItemQty(localId: number, quantity: number): void {
    this.fComboItems.update(items =>
      items.map(ci => (ci.localId === localId ? { ...ci, quantity } : ci)),
    );
  }

  toggleIsCombo(): void {
    const next = !this.fIsCombo();
    this.fIsCombo.set(next);
    if (!next) this.fComboItems.set([]);
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadImageError.set(null);
    this.uploadingImage.set(true);
    try {
      const url = await this.storageService.uploadProductImage(file);
      this.fImageUrl.set(url);
    } catch (err) {
      this.uploadImageError.set(
        err instanceof Error ? err.message : 'Error al subir la imagen.',
      );
    } finally {
      this.uploadingImage.set(false);
      input.value = '';
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  categoryName(categoryId: string): string {
    return this.categories().find(c => c.id === categoryId)?.name ?? categoryId;
  }

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

  private async loadComboItems(comboId: string): Promise<void> {
    this.loadingComboItems.set(true);
    try {
      const { data } = await this.supabase.client
        .from('combo_items')
        .select('product_id, quantity')
        .eq('combo_id', comboId);
      if (data) {
        this.fComboItems.set(
          (data as Array<{ product_id: string; quantity: number }>).map(ci => ({
            localId: ++this.nextLocalId,
            product_id: ci.product_id,
            quantity: ci.quantity,
          })),
        );
      }
    } finally {
      this.loadingComboItems.set(false);
    }
  }
}
