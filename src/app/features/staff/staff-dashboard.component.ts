import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-staff-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="min-h-dvh bg-[#f5f4f1]">

      <!-- Topbar -->
      <header class="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <span class="text-sm font-semibold text-fg tracking-tight">
          Burger House &mdash; Staff
        </span>
        <div class="flex items-center gap-4">
          <span class="text-xs text-muted font-medium">
            {{ authService.staffProfile()?.name }}
          </span>
          <button
            type="button"
            (click)="logout()"
            class="text-xs text-danger hover:text-danger/80 font-medium transition-colors cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <!-- Placeholder content -->
      <main class="flex flex-col items-center justify-center min-h-[calc(100dvh-49px)] px-4">
        <p class="text-lg font-semibold text-fg mb-1">
          Bienvenido, {{ authService.staffProfile()?.name }}
        </p>
        <p class="text-sm font-mono text-muted">
          rol: {{ authService.staffProfile()?.role }}
        </p>
      </main>

    </div>
  `,
  styles: `:host { display: block; }`,
})
export class StaffDashboardComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }
}
