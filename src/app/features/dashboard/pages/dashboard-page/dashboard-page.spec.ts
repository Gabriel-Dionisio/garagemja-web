import { Component, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';
import { ManagerDashboard } from '../../components/manager-dashboard/manager-dashboard';
import { OwnerDashboard } from '../../components/owner-dashboard/owner-dashboard';
import { DashboardPage } from './dashboard-page';

@Component({ selector: 'app-admin-dashboard', template: 'admin' })
class AdminStub {}

@Component({ selector: 'app-manager-dashboard', template: 'manager' })
class ManagerStub {}

@Component({ selector: 'app-owner-dashboard', template: 'owner' })
class OwnerStub {
  readonly spots = output<number>();
}

async function render(roles: string[]) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { hasRole: (role: string) => roles.includes(role) } },
    ],
  }).overrideComponent(DashboardPage, {
    remove: { imports: [AdminDashboard, ManagerDashboard, OwnerDashboard] },
    add: { imports: [AdminStub, ManagerStub, OwnerStub] },
  });
  const fixture = TestBed.createComponent(DashboardPage);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

describe('DashboardPage', () => {
  it('shows only the owner view without chips for a plain resident', async () => {
    const { element } = await render(['RESIDENT']);
    expect(element.querySelector('app-chip-group')).toBeNull();
    expect(element.querySelector('app-owner-dashboard')).not.toBeNull();
    expect(element.querySelector('a[href="/rentals"]')).not.toBeNull();
  });

  it('starts on the highest role and switches view with the chips', async () => {
    const { fixture, element } = await render(['ADMIN', 'CONDOMINIUM_ADMIN', 'RESIDENT']);
    expect(element.querySelectorAll('app-chip-group button')).toHaveLength(3);
    expect(element.querySelector('app-admin-dashboard')).not.toBeNull();
    expect(element.querySelector('app-manager-dashboard')).toBeNull();
    element.querySelectorAll<HTMLButtonElement>('app-chip-group button')[2].click();
    await fixture.whenStable();
    expect(element.querySelector('app-owner-dashboard')).not.toBeNull();
    expect(element.querySelector('app-admin-dashboard')).toBeNull();
  });
});
