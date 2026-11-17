import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth/auth-service';
import { UserProfile } from '../../auth/auth.model';
import { NavBadges } from '../nav-badges';
import { ViewportService } from '../viewport-service';
import { ShellLayout } from './shell-layout';

const USER: UserProfile = {
  id: '1',
  name: 'Ana Souza',
  email: 'a@x.com',
  roles: ['ADMIN'],
  photoUrl: null,
};

describe('ShellLayout', () => {
  const logout = vi.fn(() => of(undefined));
  const mobile = signal(false);

  async function setup(usesDrawer: boolean, user: UserProfile = USER, routes: Routes = []) {
    mobile.set(usesDrawer);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: {
            user: signal(user),
            logout,
            hasRole: (r: string) => user.roles.includes(r as never),
          },
        },
        { provide: NavBadges, useValue: { condominiums: signal(3), refresh: vi.fn() } },
        {
          provide: ViewportService,
          useValue: { usesDrawer: () => mobile() },
        },
      ],
    });
    const fixture = TestBed.createComponent(ShellLayout);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('mostra a navegação por papel e destaca nome e iniciais no desktop', async () => {
    const { element } = await setup(false);
    const links = Array.from(element.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toEqual([
      'Painel',
      'Condomínios3',
      'Carteira',
      'Usuários',
      'Denúncias de avaliações',
      'Auditoria',
    ]);
    const footer = element.querySelector('.footer');
    expect(footer?.querySelector('a')?.getAttribute('href')).toBe('/settings');
    expect(footer?.querySelector('button.logout')).not.toBeNull();
    expect(element.querySelector('app-language-switcher')).toBeNull();
    expect(element.querySelector('app-avatar')?.textContent?.trim()).toBe('AS');
    expect(element.querySelector('button[aria-label="Abrir menu"]')).toBeNull();
  });

  it('mostra só o primeiro nome, ignorando espaços iniciais', async () => {
    const { element } = await setup(false, { ...USER, name: '  Ana Souza' });
    const name = element.querySelector('.user-name');
    expect(name?.textContent?.trim()).toBe('Ana');
    expect(name?.getAttribute('title')).toBe('  Ana Souza');
  });

  it('mostra badge só para admin', async () => {
    expect((await setup(false)).element.querySelector('app-badge:not(.count)')).not.toBeNull();
  });

  it('não mostra badge para morador', async () => {
    const { element } = await setup(false, { ...USER, roles: ['RESIDENT'] });
    expect(element.querySelector('app-badge:not(.count)')).toBeNull();
  });

  it('mostra badge para síndico', async () => {
    const { element } = await setup(false, { ...USER, roles: ['CONDOMINIUM_ADMIN'] });
    expect(element.querySelector('app-badge:not(.count)')?.textContent?.trim()).toBe('Síndico');
  });

  it('no celular o Mais abre a folha só com o que não está na barra inferior', async () => {
    const { fixture, element } = await setup(true);
    expect(element.querySelector('aside')).toBeNull();
    expect(element.querySelector('button[aria-label="Abrir menu"]')).toBeNull();
    const more = element.querySelector('app-bottom-nav button') as HTMLButtonElement;
    expect(more.getAttribute('aria-expanded')).toBe('false');

    more.focus();
    more.click();
    await fixture.whenStable();
    const sheet = element.querySelector('aside');
    expect(sheet?.getAttribute('data-mode')).toBe('sheet');
    const links = Array.from(sheet?.querySelectorAll('nav a') ?? []).map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual(['Condomínios3', 'Carteira']);

    sheet?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(element.querySelector('aside')).toBeNull();
    expect(document.activeElement).toBe(more);
  });

  it('no celular sem atalhos na barra inferior mantém o menu em gaveta', async () => {
    const { fixture, element } = await setup(true, { ...USER, roles: [] });
    const open = element.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement;
    open.click();
    await fixture.whenStable();
    expect(element.querySelector('aside')?.getAttribute('data-mode')).toBe('drawer');
  });

  it('no desktop o Escape não tira o foco do menu', async () => {
    const { fixture, element } = await setup(false);
    const link = element.querySelector('aside a') as HTMLAnchorElement;
    link.focus();
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(link);
  });

  it('sai e vai para o login', async () => {
    const { fixture, element } = await setup(false);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    (element.querySelector('.logout') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('abre o menu do usuario ao clicar no avatar e fecha ao clicar fora', async () => {
    const { fixture, element } = await setup(false);
    (element.querySelector('.user-trigger') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(element.querySelector('#user-menu')).not.toBeNull();
    document.body.click();
    await fixture.whenStable();
    expect(element.querySelector('#user-menu')).toBeNull();
  });
});
