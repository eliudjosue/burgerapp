import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for the initial session restoration to finish (important on page reload,
  // where the guard may run before getSession() has resolved).
  await authService.initPromise;

  if (!authService.staffProfile()) {
    return router.createUrlTree(['/staff/login']);
  }

  return true;
};
