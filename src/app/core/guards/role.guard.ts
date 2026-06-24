import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { StaffProfile } from '../services/auth.service';

/**
 * Factory that returns a guard allowing access only to staff with one of
 * the specified roles (admin always passes because admin can access every view).
 *
 * Usage:
 *   canActivate: [roleGuard(['kitchen', 'admin'])]
 */
export function roleGuard(allowedRoles: Array<StaffProfile['role']>): CanActivateFn {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    await authService.initPromise;

    const profile = authService.staffProfile();
    if (!profile || !allowedRoles.includes(profile.role)) {
      return router.createUrlTree(['/staff/login']);
    }
    return true;
  };
}
