import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { StaffLoginComponent } from './staff-login.component';
import { AuthService } from '../../../core/services/auth.service';
import type { StaffProfile } from '../../../core/services/auth.service';

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile | null>(null);
  readonly initPromise = Promise.resolve();
  signIn = vi.fn().mockResolvedValue(undefined);
  signOut = vi.fn().mockResolvedValue(undefined);
}

describe('StaffLoginComponent', () => {
  let authStub: AuthServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffLoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();

    authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StaffLoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set errorMessage when signIn throws', async () => {
    authStub.signIn = vi.fn().mockRejectedValue(
      new Error('Credenciales inválidas. Verificá tu email y contraseña.'),
    );

    const fixture = TestBed.createComponent(StaffLoginComponent);
    const component = fixture.componentInstance;
    component.email = 'test@test.com';
    component.password = 'wrong';

    await component.onSubmit();

    expect(component.errorMessage()).toBe(
      'Credenciales inválidas. Verificá tu email y contraseña.',
    );
  });

  it('should navigate to /staff on successful signIn', async () => {
    const fixture = TestBed.createComponent(StaffLoginComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.email = 'admin@burger.com';
    component.password = 'correctpassword';

    await component.onSubmit();

    expect(authStub.signIn).toHaveBeenCalledWith('admin@burger.com', 'correctpassword');
    expect(router.navigate).toHaveBeenCalledWith(['/staff']);
  });

  it('should clear errorMessage on a new submission attempt', async () => {
    authStub.signIn = vi.fn()
      .mockRejectedValueOnce(new Error('Error anterior'))
      .mockResolvedValueOnce(undefined);

    const fixture = TestBed.createComponent(StaffLoginComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.email = 'a@a.com';
    component.password = 'pass';

    await component.onSubmit();
    expect(component.errorMessage()).not.toBeNull();

    await component.onSubmit();
    expect(component.errorMessage()).toBeNull();
  });

  it('should leave submitting as false after a successful submit', async () => {
    const fixture = TestBed.createComponent(StaffLoginComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.email = 'admin@burger.com';
    component.password = 'pass';

    await component.onSubmit();

    expect(component.submitting()).toBe(false);
  });

  it('should leave submitting as false after a failed submit', async () => {
    authStub.signIn = vi.fn().mockRejectedValue(new Error('Error'));

    const fixture = TestBed.createComponent(StaffLoginComponent);
    const component = fixture.componentInstance;
    component.email = 'a@a.com';
    component.password = 'p';

    await component.onSubmit();

    expect(component.submitting()).toBe(false);
  });

  it('should not submit when email or password is empty', async () => {
    const fixture = TestBed.createComponent(StaffLoginComponent);
    const component = fixture.componentInstance;
    component.email = '';
    component.password = '';

    await component.onSubmit();

    expect(authStub.signIn).not.toHaveBeenCalled();
  });
});
