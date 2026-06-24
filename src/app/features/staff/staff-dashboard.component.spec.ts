import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { StaffDashboardComponent } from './staff-dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import type { StaffProfile } from '../../core/services/auth.service';

const MOCK_PROFILE: StaffProfile = { name: 'Ana García', role: 'admin' };

class AuthServiceStub {
  readonly staffProfile = signal<StaffProfile | null>(MOCK_PROFILE);
  readonly initPromise = Promise.resolve();
  signOut = vi.fn().mockResolvedValue(undefined);
}

describe('StaffDashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StaffDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose the staffProfile name and role via authService', () => {
    const fixture = TestBed.createComponent(StaffDashboardComponent);
    const component = fixture.componentInstance;
    expect(component.authService.staffProfile()?.name).toBe(MOCK_PROFILE.name);
    expect(component.authService.staffProfile()?.role).toBe(MOCK_PROFILE.role);
  });

  it('should call signOut and navigate to /staff/login on logout', async () => {
    const fixture = TestBed.createComponent(StaffDashboardComponent);
    const component = fixture.componentInstance;
    const authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.logout();

    expect(authStub.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/staff/login']);
  });
});
