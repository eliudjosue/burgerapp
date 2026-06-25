import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseClientService } from '../../../../core/supabase.client';
import { AuthService } from '../../../../core/services/auth.service';
import { StorageService } from '../../../../core/services/storage.service';

export interface DashboardMetrics {
  today_sales: number;
  week_sales: number;
  month_sales: number;
  pending_count: number;
  top_products: Array<{ name: string; quantity: number }>;
}

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="min-h-dvh bg-[#f5f4f1]">

      <!-- Topbar -->
      <header
        class="bg-[#1c1a17] text-white px-3 py-2 flex items-center justify-between sticky top-0 z-20"
      >
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="goBack()"
            class="flex items-center gap-1 text-white/50 hover:text-white text-xs
                   cursor-pointer bg-transparent border-0 transition-colors"
            aria-label="Volver al panel"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Panel
          </button>
          <span class="font-semibold text-[15px]">Admin</span>
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
        </div>
      </header>

      <main class="px-3 pb-8 max-w-5xl mx-auto">

          <!-- Page header -->
          <div class="py-5">
            <h1 class="text-[22px] font-semibold text-fg tracking-tight">Dashboard</h1>
            <p class="text-[13px] text-muted mt-0.5">Métricas del negocio al día de hoy</p>
          </div>

          <!-- Gestión — quick-access links to admin sections -->
          <section aria-label="Gestión" class="mb-6">
            <div class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted mb-3">
              Gestión
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <a
                routerLink="/staff/admin/products"
                class="bg-surface border border-border rounded-lg p-4 flex items-center
                       gap-3 no-underline hover:border-accent/30 transition-colors"
                aria-label="Gestión de productos"
              >
                <div class="w-8 h-8 rounded-lg bg-accent-soft flex items-center
                            justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2"
                       class="text-accent" aria-hidden="true">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-[13px] font-semibold text-fg">Productos</div>
                  <div class="text-[11px] text-muted">Catálogo</div>
                </div>
              </a>
            </div>
          </section>

          <!-- Loading -->
          @if (isLoading()) {
            <div class="flex items-center justify-center h-48 text-muted text-sm">
              Cargando métricas…
            </div>
          }

          <!-- Error -->
          @else if (hasError()) {
            <div class="flex flex-col items-center justify-center py-16 text-center gap-2 px-4"
                 role="alert">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5"
                   class="text-danger opacity-50" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p class="text-sm text-muted">No se pudieron cargar las métricas.</p>
              <button
                type="button"
                (click)="ngOnInit()"
                class="text-xs text-accent underline cursor-pointer bg-transparent border-0 mt-1"
              >
                Reintentar
              </button>
            </div>
          }

          <!-- Content -->
          @else if (metrics(); as m) {

          <!-- Sales + pending metrics -->
          <section aria-label="Métricas de ventas" class="mb-6">
            <div class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted mb-3">
              Ventas
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

              <div class="bg-surface border border-border rounded-lg p-4"
                   role="region" aria-label="Ventas del día">
                <div class="text-[11px] font-mono font-medium uppercase tracking-wider text-muted">
                  Hoy
                </div>
                <div class="text-[32px] font-semibold font-mono tabular-nums leading-none mt-2 text-fg
                            truncate">
                  {{ formatCurrency(m.today_sales) }}
                </div>
              </div>

              <div class="bg-surface border border-border rounded-lg p-4"
                   role="region" aria-label="Ventas de la semana">
                <div class="text-[11px] font-mono font-medium uppercase tracking-wider text-muted">
                  Esta semana
                </div>
                <div class="text-[32px] font-semibold font-mono tabular-nums leading-none mt-2 text-fg
                            truncate">
                  {{ formatCurrency(m.week_sales) }}
                </div>
              </div>

              <div class="bg-surface border border-border rounded-lg p-4"
                   role="region" aria-label="Ventas del mes">
                <div class="text-[11px] font-mono font-medium uppercase tracking-wider text-muted">
                  Este mes
                </div>
                <div class="text-[32px] font-semibold font-mono tabular-nums leading-none mt-2 text-fg
                            truncate">
                  {{ formatCurrency(m.month_sales) }}
                </div>
              </div>

              <div
                class="bg-surface border rounded-lg p-4"
                [class.border-accent]="m.pending_count > 0"
                [class.border-border]="m.pending_count === 0"
                role="region"
                aria-label="Pedidos pendientes de confirmar"
              >
                <div class="flex items-center gap-1.5">
                  <div class="text-[11px] font-mono font-medium uppercase tracking-wider text-muted">
                    Por confirmar
                  </div>
                  @if (m.pending_count > 0) {
                    <span
                      class="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse"
                      aria-hidden="true"
                    ></span>
                  }
                </div>
                <div
                  class="text-[32px] font-semibold font-mono tabular-nums leading-none mt-2"
                  [class.text-accent]="m.pending_count > 0"
                  [class.text-fg]="m.pending_count === 0"
                >
                  {{ m.pending_count }}
                </div>
              </div>

            </div>
          </section>

          <!-- TEMP: storage upload tester — remove when product management is built -->
          <section aria-label="Prueba de subida de imágenes" class="mb-6">
            <div class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted mb-3
                        flex items-center gap-2">
              Prueba de Storage
              <span class="px-2 py-0.5 rounded-full bg-warn-soft text-warn text-[10px]
                           font-mono normal-case tracking-normal">
                temporal
              </span>
            </div>

            <div class="bg-surface border border-border rounded-lg p-4">
              <p class="text-[13px] text-muted mb-3">
                Subí una imagen (JPG, PNG o WebP, máx. 2 MB) para confirmar que Storage funciona.
              </p>

              <label class="block" [class.opacity-50]="uploading()">
                <span class="sr-only">Elegir imagen de producto</span>
                <input
                  #fileInput
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onFileSelected($event)"
                  [disabled]="uploading()"
                  class="block text-[13px] text-muted cursor-pointer
                         file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                         file:text-[12px] file:font-semibold file:bg-accent file:text-white
                         file:cursor-pointer"
                />
              </label>

              @if (uploading()) {
                <p class="text-[13px] text-muted mt-3">Subiendo…</p>
              }

              @if (uploadResult()) {
                <div class="mt-3 p-3 bg-success-soft rounded-lg">
                  <p class="text-[12px] text-success font-semibold mb-1">
                    Subida exitosa — abrí el link para verificar:
                  </p>
                  <a
                    [href]="uploadResult()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[12px] text-accent underline break-all font-mono"
                    [attr.aria-label]="'Ver imagen subida en nueva pestaña'"
                  >{{ uploadResult() }}</a>
                </div>
              }

              @if (uploadError()) {
                <div class="mt-3 p-3 bg-danger-soft rounded-lg" role="alert">
                  <p class="text-[12px] text-danger">{{ uploadError() }}</p>
                </div>
              }
            </div>
          </section>

          <!-- Top products -->
          <section aria-label="Productos más vendidos">
            <div class="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted mb-3">
              Top 3 productos
            </div>

            @if (m.top_products.length === 0) {
              <div class="bg-surface border border-border rounded-lg p-6 text-center
                          text-sm text-muted">
                Sin datos de ventas todavía.
              </div>
            } @else {
              <div class="bg-surface border border-border rounded-lg overflow-hidden">
                <table class="w-full" aria-label="Productos más vendidos por unidades">
                  <thead>
                    <tr class="border-b border-border">
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted w-10">
                        #
                      </th>
                      <th scope="col"
                          class="text-left px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Producto
                      </th>
                      <th scope="col"
                          class="text-right px-4 py-3 text-[11px] font-mono font-semibold
                                 uppercase tracking-wider text-muted">
                        Unidades
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (product of m.top_products; track product.name; let i = $index) {
                      <tr class="border-b border-border/50 last:border-0
                                 hover:bg-[rgba(28,26,23,0.04)] transition-colors">
                        <td class="px-4 py-3 font-mono text-[13px] text-muted">
                          {{ i + 1 }}
                        </td>
                        <td class="px-4 py-3 text-[14px] font-medium text-fg">
                          {{ product.name }}
                        </td>
                        <td class="px-4 py-3 text-right font-mono text-[14px] tabular-nums text-fg">
                          {{ product.quantity }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>

          }

      </main>

    </div>
  `,
  styles: `:host { display: block; }`,
})
export class AdminDashboardComponent implements OnInit {
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly metrics = signal<DashboardMetrics | null>(null);

  readonly uploading = signal(false);
  readonly uploadResult = signal<string | null>(null);
  readonly uploadError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    try {
      const { data, error } = await this.supabase.client.rpc('get_dashboard_metrics');
      if (error) throw error;
      this.metrics.set(data as DashboardMetrics);
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadResult.set(null);
    this.uploadError.set(null);
    this.uploading.set(true);

    try {
      const url = await this.storageService.uploadProductImage(file);
      this.uploadResult.set(url);
    } catch (err) {
      this.uploadError.set(err instanceof Error ? err.message : 'Error al subir la imagen.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  formatCurrency(amount: number): string {
    return '$' + new Intl.NumberFormat('es-AR').format(amount);
  }

  goBack(): void {
    this.router.navigate(['/staff']);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }
}
