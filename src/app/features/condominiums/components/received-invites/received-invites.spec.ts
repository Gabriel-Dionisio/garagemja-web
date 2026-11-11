import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { NavBadges } from '../../../../core/layout/nav-badges';
import { provideTestTranslations } from '../../../../testing/translations';
import { CondominiumsApi } from '../../data/condominiums-api';
import { ReceivedInvites } from './received-invites';

describe('ReceivedInvites', () => {
  const declineInvite = vi.fn();
  const acceptInvite = vi.fn();
  const myInvites = vi.fn();

  async function setup() {
    declineInvite.mockReset().mockReturnValue(of(undefined));
    acceptInvite.mockReset().mockReturnValue(of(undefined));
    myInvites.mockReset().mockReturnValue(
      of([
        { id: 'i1', condominiumName: 'Alpha', expiresAt: '2030-01-01T00:00:00Z' },
        { id: 'i2', condominiumName: 'Beta', expiresAt: '2030-01-01T00:00:00Z' },
      ]),
    );
    TestBed.configureTestingModule({
      providers: [
        provideTestTranslations(),
        { provide: CondominiumsApi, useValue: { myInvites, declineInvite, acceptInvite } },
        { provide: AuthService, useValue: { loadSession: () => of(null) } },
        { provide: NavBadges, useValue: { refresh: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ReceivedInvites);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  const button = (element: HTMLElement, label: string) =>
    element.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;

  it('removes a declined invite without reloading', async () => {
    const { fixture, element } = await setup();
    expect(element.querySelectorAll('li')).toHaveLength(2);
    button(element, 'Recusar: Alpha').click();
    await fixture.whenStable();
    expect(declineInvite).toHaveBeenCalledWith('i1');
    expect(element.querySelectorAll('li')).toHaveLength(1);
  });

  it('accepts as resident by default and tells the page', async () => {
    const { fixture, element } = await setup();
    const accepted = vi.fn();
    fixture.componentInstance.accepted.subscribe(accepted);
    button(element, 'Aceitar: Alpha').click();
    await fixture.whenStable();
    expect(acceptInvite).toHaveBeenCalledWith('i1', true);
    expect(accepted).toHaveBeenCalled();
  });

  it('restores the invite and shows an error when declining fails', async () => {
    const { fixture, element } = await setup();
    declineInvite.mockReturnValue(throwError(() => new Error('boom')));
    button(element, 'Recusar: Alpha').click();
    await fixture.whenStable();
    expect(element.querySelectorAll('li')).toHaveLength(2);
    expect(element.querySelector('app-alert')).not.toBeNull();
  });
});
