import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import type { StaffProfile } from '../services/auth.service';

function makeAuthStub(profile: StaffProfile | null) {
  return {
    initPromise: Promise.resolve(),
    staffProfile: signal<StaffProfile | null>(profile),
  };
}

async function runGuard(
  authStub: ReturnType<typeof makeAuthStub>,
  allowedRoles: Array<StaffProfile['role']>,
) {
  await TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authStub },
    ],
  }).compileComponents();

  const guard = roleGuard(allowedRoles);
  return TestBed.runInInjectionContext(() => guard({} as never, {} as never));
}

describe('roleGuard', () => {
  it('should return true when the profile role is in allowedRoles', async () => {
    const result = await runGuard(
      makeAuthStub({ name: 'Chef', role: 'kitchen' }),
      ['kitchen', 'admin'],
    );
    expect(result).toBe(true);
  });

  it('should return true when admin accesses a kitchen route', async () => {
    const result = await runGuard(
      makeAuthStub({ name: 'Admin', role: 'admin' }),
      ['kitchen', 'admin'],
    );
    expect(result).toBe(true);
  });

  it('should redirect to /staff/login when no session', async () => {
    const result = await runGuard(makeAuthStub(null), ['kitchen', 'admin']);
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/staff/login');
  });

  it('should redirect to /staff/login when role is not in allowedRoles', async () => {
    const result = await runGuard(
      makeAuthStub({ name: 'Caja', role: 'cashier' }),
      ['kitchen', 'admin'],
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/staff/login');
  });
});
