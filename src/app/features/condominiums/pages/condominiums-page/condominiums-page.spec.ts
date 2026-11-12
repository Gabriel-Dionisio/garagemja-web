import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { NavBadges } from '../../../../core/layout/nav-badges';
import { CondominiumsApi } from '../../data/condominiums-api';
import { CondominiumsPage } from './condominiums-page';

const emptyPage = { items: [], page: 0, size: 20, hasNext: false, total: 0 };

const item = (id: string, canManage: boolean) => ({
  id,
  name: `Cond ${id}`,
  city: null,
  state: null,
  status: 'ACTIVE',
  canManage,
  resides: true,
  residency: { id: `r-${id}`, status: 'APPROVED', unit: '12', block: 'B' },
  thumbnailUrl: null,
});

describe('CondominiumsPage', () => {
  const list = vi.fn();
  const myInvites = vi.fn();
  const managed = vi.fn();

  async function setup(roles: string[], page: unknown = emptyPage) {
    list.mockReset().mockReturnValue(of(page));
    myInvites.mockReset().mockReturnValue(of([]));
    managed.mockReset().mockReturnValue(of(emptyPage));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasRole: (r: string) => roles.includes(r) } },
        { provide: NavBadges, useValue: { refresh: vi.fn() } },
        { provide: CondominiumsApi, useValue: { list, myInvites, managed } },
      ],
    });
    const fixture = TestBed.createComponent(CondominiumsPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  const withItems = (...items: ReturnType<typeof item>[]) => ({
    ...emptyPage,
    items,
    total: items.length,
  });

  it('loads everything first and filters by the chosen status tab', async () => {
    const { fixture, element } = await setup(['ADMIN']);
    expect(list).toHaveBeenLastCalledWith(
      { status: undefined, mine: false },
      0,
      expect.any(Number),
    );
    const tab = Array.from(element.querySelectorAll('app-chip-group button')).find((b) =>
      b.textContent?.includes('Encerrado'),
    ) as HTMLButtonElement;
    tab.click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith({ status: 'CLOSED', mine: false }, 0, expect.any(Number));
  });

  it('hides the create and join actions from the admin', async () => {
    const { element } = await setup(['ADMIN']);
    expect(element.querySelector('a[href="/condominiums/new"]')).toBeNull();
    expect(element.textContent).not.toContain('Entrar com código');
    expect(element.querySelector('app-received-invites')).toBeNull();
  });

  it('sends the typed name, city and state to the API', async () => {
    const { fixture, element } = await setup(['RESIDENT'], withItems(item('a', false)));
    const input = (label: string) =>
      Array.from(element.querySelectorAll('app-text-field'))
        .find((f) => f.textContent?.includes(label))
        ?.querySelector('input') as HTMLInputElement;
    const name = input('Nome do condomínio');
    name.value = ' Solar ';
    name.dispatchEvent(new Event('input'));
    (element.querySelector('app-condominium-filter form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(
      { name: 'Solar', city: '', state: '', status: undefined, mine: true },
      0,
      expect.any(Number),
    );
  });

  it('hides the status tabs from non-admins', async () => {
    const { element } = await setup(['RESIDENT'], withItems(item('a', false)));
    expect(element.querySelector('app-chip-group')).toBeNull();
  });

  it('shows the three welcome cards to an account without condominiums', async () => {
    const { element } = await setup(['RESIDENT']);
    expect(element.querySelectorAll('app-welcome-cards li').length).toBe(3);
    expect(element.querySelector('a[href="/condominiums/new"]')).not.toBeNull();
  });

  it('does not show the welcome cards when the list has condominiums', async () => {
    const { element } = await setup(['RESIDENT'], withItems(item('a', false)));
    expect(element.querySelector('app-welcome-cards')).toBeNull();
  });

  it('opens the join dialog in code mode from the welcome card', async () => {
    const { fixture, element } = await setup(['RESIDENT']);
    const open = vi.spyOn(TestBed.inject(Dialog), 'open').mockReturnValue({
      closed: of(true),
    } as never);
    element.querySelector<HTMLButtonElement>('app-welcome-cards li button')!.click();
    await fixture.whenStable();
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: { mode: 'code' } }),
    );
  });

  it('shows the received invites card on top', async () => {
    myInvites.mockReset().mockReturnValue(
      of([
        {
          id: 'i1',
          condominiumId: 'c1',
          condominiumName: 'Edifício A',
          invitedEmail: 'a@b.c',
          expiresAt: '2026-11-12T10:00:00Z',
        },
      ]),
    );
    list.mockReset().mockReturnValue(of(emptyPage));
    managed.mockReset().mockReturnValue(of(emptyPage));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { hasRole: () => false } },
        { provide: NavBadges, useValue: { refresh: vi.fn() } },
        { provide: CondominiumsApi, useValue: { list, myInvites, managed } },
      ],
    });
    const fixture = TestBed.createComponent(CondominiumsPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Edifício A');
  });

  it('mostra Moro aqui e permite sair só de quem não administra', async () => {
    const { element } = await setup(['RESIDENT'], withItems(item('a', true), item('b', false)));
    expect(element.querySelectorAll('.resides').length).toBe(2);
    expect(element.querySelectorAll('li button[aria-label="Deixar este condomínio"]').length).toBe(
      1,
    );
  });

  it('links the pending residents badge to the residents list filtered by PENDING', async () => {
    const { fixture, element } = await setup(['CONDOMINIUM_ADMIN'], withItems(item('a', true)));
    managed.mockReturnValue(
      of({ ...emptyPage, items: [{ id: 'a', name: 'Cond a', pendingResidents: 2 }] }),
    );
    fixture.componentInstance['refresh']();
    await fixture.whenStable();
    const link = element.querySelector<HTMLAnchorElement>('a.pending');
    expect(link?.getAttribute('href')).toBe('/condominiums/a/residents?status=PENDING');
    expect(link?.textContent).toContain('2');
  });

  it('abre o diálogo de código pelo botão Entrar com código', async () => {
    const { fixture, element } = await setup(['RESIDENT'], withItems(item('a', false)));
    const open = vi.spyOn(TestBed.inject(Dialog), 'open').mockReturnValue({
      closed: of(true),
    } as never);
    const join = Array.from(element.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Entrar com código'),
    )!;
    join.click();
    await fixture.whenStable();
    expect(open).toHaveBeenCalled();
    expect(element.querySelector('app-alert')?.textContent).toContain('Pedido enviado');
  });

  it('mostra ao síndico sem moradia só os administrados, com ações no cabeçalho e sem boas-vindas', async () => {
    const managedOnly = { ...item('m', true), resides: false } as unknown as ReturnType<
      typeof item
    >;
    managedOnly.residency = null as never;
    const { element } = await setup(['CONDOMINIUM_ADMIN'], withItems(managedOnly));
    expect(list).toHaveBeenCalledWith({ mine: true, status: undefined }, 0, expect.any(Number));
    expect(element.querySelectorAll('li[appListItem]')).toHaveLength(1);
    expect(element.querySelector('app-welcome-cards')).toBeNull();
    const header = element.querySelector('app-page-header')!;
    expect(header.textContent).toContain('Entrar com código');
    expect(header.querySelector('a[href="/condominiums/new"]')).not.toBeNull();
  });
});
