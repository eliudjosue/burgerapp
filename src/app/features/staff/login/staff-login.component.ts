import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-staff-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-dvh bg-[#f5f4f1] flex items-center justify-center px-4 py-8">
      <div class="bg-surface border border-border rounded-xl p-8 w-full max-w-sm shadow-sm">

        <!-- Brand -->
        <div class="text-center mb-8">
          <p class="text-xs font-medium text-muted tracking-widest uppercase mb-1">
            Panel de staff
          </p>
          <h1 class="text-2xl font-bold text-accent">Burger House</h1>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" novalidate class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-muted mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              autocomplete="username"
              class="border border-border rounded-md px-3.5 py-3 w-full text-sm
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     bg-white placeholder:text-muted/50"
              placeholder="staff@burguerhouse.com"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-muted mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                required
                autocomplete="current-password"
                class="border border-border rounded-md px-3.5 py-3 pr-11 w-full text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                       bg-white"
              >
              <button
                type="button"
                (click)="showPassword.update(v => !v)"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fg
                       transition-colors cursor-pointer"
              >
                @if (showPassword()) {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                         a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
                         l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59
                         m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
                         a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                         -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="submitting()"
            class="w-full py-3 rounded-full bg-accent text-white text-sm font-semibold
                   hover:bg-accent/90 active:scale-[0.98] transition-all
                   disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {{ submitting() ? 'Ingresando…' : 'Ingresar' }}
          </button>

          @if (errorMessage()) {
            <p role="alert" class="text-sm text-danger text-center leading-snug">
              {{ errorMessage() }}
            </p>
          }
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <a routerLink="/" class="text-xs text-muted hover:text-fg transition-colors">
            ← Volver al sitio público
          </a>
        </div>
      </div>
    </div>
  `,
  styles: `:host { display: block; }`,
})
export class StaffLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/staff']);
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error
          ? err.message
          : 'Error al iniciar sesión. Intentá de nuevo.',
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
