import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth-service';
import { Role } from '../auth/auth.model';
import { NavBadges, sumPendingResidents } from './nav-badges';

describe('NavBadges', () => {
  function setup(roles: Role[]) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => true, hasRole: (r: Role) => roles.includes(r) },
        },
      ],
    });
    return { badges: TestBed.inject(NavBadges), http: TestBed.inject(HttpTestingController) };
  }

  it('soma moradores pendentes e convites do síndico', () => {
    const { badges, http } = setup(['CONDOMINIUM_ADMIN']);
    badges.refresh();
    http
      .expectOne((r) => r.url === '/api/v1/me/managed-condominiums')
      .flush([{ pendingResidents: 2 }, { pendingResidents: 1 }]);
    http.expectOne('/api/v1/me/manager-invites').flush([{}]);
    expect(badges.condominiums()).toBe(4);
  });

  it('morador só conta convites e ADMIN não consulta nada', () => {
    const resident = setup(['RESIDENT']);
    resident.badges.refresh();
    resident.http.expectOne('/api/v1/me/manager-invites').flush([{}, {}]);
    expect(resident.badges.condominiums()).toBe(2);
    resident.http.verify();
  });

  it('ignora corpo inválido', () => {
    expect(sumPendingResidents({})).toBe(0);
    expect(sumPendingResidents([null, { pendingResidents: 'x' }, { pendingResidents: 3 }])).toBe(3);
  });
});
