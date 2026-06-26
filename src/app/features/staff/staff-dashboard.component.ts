import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const ROLE_ROUTES: Record<string, string> = {
  kitchen: '/staff/kitchen',
  cashier: '/staff/cashier',
  admin: '/staff/admin',
};

@Component({
  selector: 'app-staff-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  // Shown only when the authenticated role is unrecognized (should not happen in practice)
  template: `
    <div class="min-h-dvh bg-[#f5f4f1] flex flex-col items-center justify-center px-4 gap-3">
      <p class="text-sm font-semibold text-fg">Rol no reconocido</p>
      <p class="text-xs text-muted font-mono">
        {{ authService.staffProfile()?.role ?? 'sin rol' }}
      </p>
      <button
        type="button"
        (click)="logout()"
        class="text-xs text-danger hover:text-danger/80 font-medium transition-colors cursor-pointer"
      >
        Cerrar sesión
      </button>
    </div>
  `,
  styles: `:host { display: block; }`,
})
export class StaffDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const role = this.authService.staffProfile()?.role;
    const target = role ? ROLE_ROUTES[role] : undefined;
    if (target) {
      this.router.navigate([target], { replaceUrl: true });
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/staff/login']);
  }
}
