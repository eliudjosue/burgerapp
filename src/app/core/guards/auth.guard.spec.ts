import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import type { StaffProfile } from '../services/auth.service';

describe('authGuard', () => {
  it('should return true when a staffProfile is set', async () => {
    const authStub = {
      initPromise: Promise.resolve(),
      staffProfile: signal<StaffProfile>({ name: 'Admin', role: 'admin' }),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /staff/login when no staffProfile is set', async () => {
    const authStub = {
      initPromise: Promise.resolve(),
      staffProfile: signal<StaffProfile | null>(null),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/staff/login');
  });
});
