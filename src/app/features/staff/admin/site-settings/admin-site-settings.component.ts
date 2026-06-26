import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SiteSettingsService } from '../../../../core/services/site-settings.service';
import { StorageService } from '../../../../core/services/storage.service';

const PLACEHOLDER_VALUES: ReadonlySet<string> = new Set([
  'ALIAS.PENDIENTE',
  '0000000000000000000000',
  '5400000000000',
]);

@Component({
  selector: 'app-admin-site-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-dvh bg-[#f5f4f1]">

      <!-- ─── Topbar ────────────────────────────────────────────────────── -->
      <header
        class="bg-[#1c1a17] text-white px-3 py-2 flex items-center justify-between
               sticky top-0 z-20"
      >
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
          <span class="font-semibold text-[15px]">Configuración del sitio</span>
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
            (click)="save()"
            [disabled]="saving() || isLoading()"
            class="bg-accent text-white text-[12px] font-semibold px-3 py-1.5
                   rounded-lg border-0 cursor-pointer hover:opacity-90 transition-opacity
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </header>

      <!-- ─── Loading ──────────────────────────────────────────────────── -->
      @if (isLoading()) {
        <div class="flex items-center justify-center h-48 text-muted text-sm">
          Cargando configuración…
        </div>
      }

      <!-- ─── Error ─────────────────────────────────────────────────────── -->
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
          <p class="text-sm text-muted">No se pudo cargar la configuración.</p>
          <button
            type="button"
            (click)="ngOnInit()"
            class="text-xs text-accent underline cursor-pointer bg-transparent border-0 mt-1"
          >
            Reintentar
          </button>
        </div>
      }

      <!-- ─── Form ──────────────────────────────────────────────────────── -->
      @else {
        <main class="px-3 pb-10 max-w-2xl mx-auto">

          <div class="py-5">
            <h1 class="text-[22px] font-semibold text-fg tracking-tight">
              Configuración del sitio
            </h1>
            <p class="text-[13px] text-muted mt-0.5">
              Editá el contenido del sitio público sin tocar código.
            </p>
          </div>

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

          <!-- Save success -->
          @if (saveSuccess()) {
            <div role="status" class="mb-4 p-3 bg-success-soft rounded-lg">
              <p class="text-[13px] text-success font-medium">
                Cambios guardados correctamente.
              </p>
            </div>
          }

          <!-- ── Section: Identidad ───────────────────────────────────── -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Identidad
            </p>

            <!-- Logo upload -->
            <div class="mb-1">
              <span class="text-[13px] font-medium text-muted block mb-2">
                Logo del negocio
              </span>
              <div class="flex items-center gap-3">
                @if (fLogoUrl()) {
                  <img
                    [src]="fLogoUrl()"
                    alt="Logo actual"
                    class="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
                  />
                } @else {
                  <div
                    class="w-16 h-16 rounded-lg border border-dashed border-border
                           flex items-center justify-center text-muted/40 shrink-0"
                    aria-label="Sin logo cargado"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                }
                <div>
                  <button
                    type="button"
                    (click)="logoInput.click()"
                    class="py-1.5 px-3 rounded-lg text-[12px] font-semibold
                           border border-border bg-surface text-fg cursor-pointer
                           hover:border-muted/50 transition-colors"
                  >
                    {{ logoFile() ? logoFile()!.name : 'Seleccionar imagen' }}
                  </button>
                  @if (logoFile()) {
                    <p class="text-[11px] text-muted mt-1">Se subirá al guardar</p>
                  }
                </div>
              </div>
              <input
                #logoInput
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                aria-label="Archivo de logo"
                (change)="onLogoFileChange($event)"
              />
              <p class="text-[11px] text-muted mt-2">JPG, PNG o WebP · máx 2 MB</p>
            </div>
          </div>

          <!-- ── Section: Banner principal ───────────────────────────── -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Banner principal (Home)
            </p>

            <!-- Banner image preview -->
            @if (fBannerImageUrl()) {
              <img
                [src]="fBannerImageUrl()"
                alt="Banner actual"
                class="w-full h-28 object-cover rounded-lg border border-border mb-2"
              />
            } @else {
              <div
                class="w-full h-28 rounded-lg border border-dashed border-border
                       flex items-center justify-center text-[13px] text-muted/60 mb-2"
                aria-label="Sin imagen de banner cargada"
              >
                Sin imagen de banner
              </div>
            }

            @if (bannerFile()) {
              <p class="text-[11px] text-muted mb-2">
                {{ bannerFile()!.name }} — se subirá al guardar
              </p>
            }

            <button
              type="button"
              (click)="bannerInput.click()"
              class="py-1.5 px-3 rounded-lg text-[12px] font-semibold
                     border border-border bg-surface text-fg cursor-pointer
                     hover:border-muted/50 transition-colors"
            >
              Cambiar imagen de banner
            </button>
            <input
              #bannerInput
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              aria-label="Archivo de imagen de banner"
              (change)="onBannerFileChange($event)"
            />
            <p class="text-[11px] text-muted mt-1 mb-4">JPG, PNG o WebP · máx 2 MB</p>

            <!-- Banner text fields -->
            <label class="block mb-3">
              <span class="text-[13px] font-medium text-muted block mb-1">Título del banner</span>
              <input
                type="text"
                [value]="fBannerTitle()"
                (input)="fBannerTitle.set($any($event.target).value)"
                placeholder="Ej: ¡Hamburguesas Artesanales!"
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
            </label>

            <label class="block mb-3">
              <span class="text-[13px] font-medium text-muted block mb-1">Bajada</span>
              <input
                type="text"
                [value]="fBannerSubtitle()"
                (input)="fBannerSubtitle.set($any($event.target).value)"
                placeholder="Ej: Pedido online, entrega a domicilio."
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
            </label>

            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-[13px] font-medium text-muted block mb-1">
                  Texto del botón
                </span>
                <input
                  type="text"
                  [value]="fBannerButtonText()"
                  (input)="fBannerButtonText.set($any($event.target).value)"
                  placeholder="Ej: Ver Catálogo"
                  autocomplete="off"
                  class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
                />
              </label>
              <label class="block">
                <span class="text-[13px] font-medium text-muted block mb-1">
                  Link del botón
                </span>
                <input
                  type="text"
                  [value]="fBannerButtonLink()"
                  (input)="fBannerButtonLink.set($any($event.target).value)"
                  placeholder="Ej: /catalog"
                  autocomplete="off"
                  class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                         focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
                />
              </label>
            </div>
          </div>

          <!-- ── Section: Horarios ───────────────────────────────────── -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Horarios de atención
            </p>

            <label class="block">
              <span class="text-[13px] font-medium text-muted block mb-1">
                Horarios (informativo, no bloquea pedidos)
              </span>
              <input
                type="text"
                [value]="fBusinessHours()"
                (input)="fBusinessHours.set($any($event.target).value)"
                placeholder='Ej: Lun a Sáb 18:00–23:30 · Dom 19:00–23:00'
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg"
              />
              <span class="text-[11px] text-muted mt-1 block">
                Formato libre. Se muestra en la home y en el pie de página.
              </span>
            </label>
          </div>

          <!-- ── Section: Contacto ───────────────────────────────────── -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Contacto
            </p>

            <label class="block">
              <span class="text-[13px] font-medium text-muted flex items-center gap-2 mb-1">
                Número de WhatsApp
                @if (isPending(fWhatsappNumber())) {
                  <span class="text-[10px] font-semibold text-warn uppercase tracking-wide">
                    Pendiente
                  </span>
                }
              </span>
              <input
                type="tel"
                [value]="fWhatsappNumber()"
                (input)="fWhatsappNumber.set($any($event.target).value)"
                placeholder="Ej: 5491123456789"
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       font-mono"
                [class.border-danger]="hasWhatsAppError()"
                [class.border-border]="!hasWhatsAppError()"
              />
              <span class="text-[11px] text-muted mt-1 block">
                Solo dígitos, con código de país. Ej: 549 + área + número (sin el 0 del área).
              </span>
            </label>
          </div>

          <!-- ── Section: Transferencia bancaria ────────────────────── -->
          <div class="bg-surface border border-border rounded-lg p-4 mb-3">
            <p class="text-[11px] font-mono font-semibold uppercase tracking-wider
                      text-muted mb-4">
              Transferencia bancaria
            </p>
            <p class="text-[13px] text-muted mb-4">
              Se muestran al cliente en el checkout cuando elige "Transferencia bancaria".
            </p>

            <label class="block mb-3">
              <span class="text-[13px] font-medium text-muted flex items-center gap-2 mb-1">
                Alias
                @if (isPending(fBankTransferAlias())) {
                  <span class="text-[10px] font-semibold text-warn uppercase tracking-wide">
                    Pendiente
                  </span>
                }
              </span>
              <input
                type="text"
                [value]="fBankTransferAlias()"
                (input)="fBankTransferAlias.set($any($event.target).value)"
                placeholder="Ej: burger.house.mp"
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       font-mono"
              />
            </label>

            <label class="block">
              <span class="text-[13px] font-medium text-muted flex items-center gap-2 mb-1">
                CBU / CVU (22 dígitos)
                @if (isPending(fBankTransferCbu())) {
                  <span class="text-[10px] font-semibold text-warn uppercase tracking-wide">
                    Pendiente
                  </span>
                }
              </span>
              <input
                type="text"
                [value]="fBankTransferCbu()"
                (input)="fBankTransferCbu.set($any($event.target).value)"
                placeholder="Ej: 0000003100012345678901"
                autocomplete="off"
                class="w-full text-[14px] px-3 py-2 rounded-lg border border-border
                       focus:outline-none focus:border-accent bg-[#f5f4f1] text-fg
                       font-mono"
              />
            </label>
          </div>

          <!-- Bottom save button -->
          <div class="pt-2">
            <button
              type="button"
              (click)="save()"
              [disabled]="saving()"
              class="w-full bg-accent text-white text-[14px] font-semibold
                     py-3 rounded-lg border-0 cursor-pointer hover:opacity-90
                     transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>

        </main>
      }

    </div>
  `,
  styles: `:host { display: block; }`,
})
export class AdminSiteSettingsComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);

  // ── Load state ────────────────────────────────────────────────────────────
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  // ── Save state ────────────────────────────────────────────────────────────
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  // ── File staging ──────────────────────────────────────────────────────────
  readonly logoFile = signal<File | null>(null);
  readonly bannerFile = signal<File | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  readonly fLogoUrl = signal<string | null>(null);
  readonly fBannerImageUrl = signal<string | null>(null);
  readonly fBannerTitle = signal('');
  readonly fBannerSubtitle = signal('');
  readonly fBannerButtonText = signal('');
  readonly fBannerButtonLink = signal('');
  readonly fBusinessHours = signal('');
  readonly fWhatsappNumber = signal('');
  readonly fBankTransferAlias = signal('');
  readonly fBankTransferCbu = signal('');

  // ── Validation ────────────────────────────────────────────────────────────
  readonly triedSave = signal(false);

  readonly formErrors = computed(() => {
    const errors: string[] = [];
    const wa = this.fWhatsappNumber().trim();
    if (wa && !/^\d{10,15}$/.test(wa)) {
      errors.push(
        'El número de WhatsApp debe contener solo dígitos (10 a 15), con código de país.',
      );
    }
    return errors;
  });

  readonly visibleErrors = computed(() =>
    this.triedSave() ? this.formErrors() : [],
  );

  readonly hasWhatsAppError = computed(
    () => this.triedSave() && this.formErrors().some(e => e.includes('WhatsApp')),
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    this.hasError.set(false);
    try {
      const s = await this.siteSettingsService.getSettings();
      this.fLogoUrl.set(s.logoUrl);
      this.fBannerImageUrl.set(s.bannerImageUrl);
      this.fBannerTitle.set(s.bannerTitle ?? '');
      this.fBannerSubtitle.set(s.bannerSubtitle ?? '');
      this.fBannerButtonText.set(s.bannerButtonText ?? '');
      this.fBannerButtonLink.set(s.bannerButtonLink ?? '');
      this.fBusinessHours.set(s.businessHours ?? '');
      this.fWhatsappNumber.set(s.whatsappNumber ?? '');
      this.fBankTransferAlias.set(s.bankTransferAlias ?? '');
      this.fBankTransferCbu.set(s.bankTransferCbu ?? '');
    } catch {
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── File handlers ─────────────────────────────────────────────────────────
  onLogoFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!this.storageService.allowedTypes.has(file.type)) {
      this.saveError.set('Tipo de archivo no permitido para el logo. Usá JPG, PNG o WebP.');
      return;
    }
    if (file.size > this.storageService.maxSizeBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      this.saveError.set(`El logo no puede superar 2 MB (tamaño actual: ${mb} MB).`);
      return;
    }

    this.logoFile.set(file);
    this.saveError.set(null);
  }

  onBannerFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!this.storageService.allowedTypes.has(file.type)) {
      this.saveError.set('Tipo de archivo no permitido para el banner. Usá JPG, PNG o WebP.');
      return;
    }
    if (file.size > this.storageService.maxSizeBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      this.saveError.set(`El banner no puede superar 2 MB (tamaño actual: ${mb} MB).`);
      return;
    }

    this.bannerFile.set(file);
    this.saveError.set(null);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async save(): Promise<void> {
    this.triedSave.set(true);
    if (this.formErrors().length > 0) return;

    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    try {
      let logoUrl = this.fLogoUrl();
      const logoFile = this.logoFile();
      if (logoFile) {
        logoUrl = await this.storageService.uploadSiteAsset(logoFile);
        this.fLogoUrl.set(logoUrl);
        this.logoFile.set(null);
      }

      let bannerImageUrl = this.fBannerImageUrl();
      const bannerFile = this.bannerFile();
      if (bannerFile) {
        bannerImageUrl = await this.storageService.uploadSiteAsset(bannerFile);
        this.fBannerImageUrl.set(bannerImageUrl);
        this.bannerFile.set(null);
      }

      await this.siteSettingsService.updateSettings({
        logoUrl,
        bannerImageUrl,
        bannerTitle:         this.fBannerTitle().trim() || null,
        bannerSubtitle:      this.fBannerSubtitle().trim() || null,
        bannerButtonText:    this.fBannerButtonText().trim() || null,
        bannerButtonLink:    this.fBannerButtonLink().trim() || null,
        businessHours:       this.fBusinessHours().trim() || null,
        whatsappNumber:      this.fWhatsappNumber().trim() || null,
        bankTransferAlias:   this.fBankTransferAlias().trim() || null,
        bankTransferCbu:     this.fBankTransferCbu().trim() || null,
      });

      this.saveSuccess.set(true);
    } catch (err) {
      this.saveError.set(
        err instanceof Error ? err.message : 'Error al guardar la configuración.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isPending(value: string | null): boolean {
    return value !== null && PLACEHOLDER_VALUES.has(value);
  }

  goBack(): void {
    this.router.navigate(['/staff/admin']);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }
}
