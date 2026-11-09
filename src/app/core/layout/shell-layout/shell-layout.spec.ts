import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth/auth-service';
import { UserProfile } from '../../auth/auth.model';
import { ViewportService } from '../viewport-service';
import { ShellLayout } from './shell-layout';

const USER: UserProfile = {
  id: '1',
  name: 'Ana Souza',
  email: 'a@x.com',
  roles: ['ADMIN'],
};

@Component({ template: '' })
class RoutePage {}

describe('ShellLayout', () => {
  const logout = vi.fn(() => of(undefined));
  const mobile = signal(false);

  async function setup(usesDrawer: boolean, user: UserProfile = USER) {
    mobile.set(usesDrawer);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', component: RoutePage },
          { path: 'rentals', component: RoutePage, data: { hideTopbar: true } },
        ]),
        { provide: AuthService, useValue: { user: signal(user), logout } },
        {
          provide: ViewportService,
          useValue: { usesDrawer: () => mobile(), isDesktop: () => !mobile() },
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
    expect(links).toEqual(['Início', 'Usuários']);
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
    expect((await setup(false)).element.querySelector('app-badge')).not.toBeNull();
  });

  it('não mostra badge para morador', async () => {
    const { element } = await setup(false, { ...USER, roles: ['RESIDENT'] });
    expect(element.querySelector('app-badge')).toBeNull();
  });

  it('oculta a barra somente na rota marcada e a restaura ao voltar para Home', async () => {
    const { fixture, element } = await setup(false);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/rentals');
    await fixture.whenStable();
    expect(element.querySelector('header.topbar')).toBeNull();
    expect(element.getAttribute('data-topbar')).toBe('hidden');

    await router.navigateByUrl('/home');
    await fixture.whenStable();
    expect(element.querySelector('header.topbar')).not.toBeNull();
    expect(element.querySelector('app-language-switcher')).not.toBeNull();
    expect(element.getAttribute('data-topbar')).toBe('visible');
  });

  it('mantém acesso à sidebar drawer quando a barra está oculta', async () => {
    const { fixture, element } = await setup(true);
    await TestBed.inject(Router).navigateByUrl('/rentals');
    await fixture.whenStable();

    expect(element.querySelector('header.topbar')).toBeNull();
    const open = element.querySelector(
      'button.rentals-menu-button[aria-label="Abrir menu"]',
    ) as HTMLButtonElement;
    expect(open).not.toBeNull();
    open.click();
    await fixture.whenStable();
    expect(element.querySelector('aside')).not.toBeNull();
  });

  it('mostra badge para síndico', async () => {
    const { element } = await setup(false, { ...USER, roles: ['CONDOMINIUM_ADMIN'] });
    expect(element.querySelector('app-badge')?.textContent?.trim()).toBe('Síndico');
  });

  it('no celular abre e fecha o menu em gaveta', async () => {
    const { fixture, element } = await setup(true);
    expect(element.querySelector('aside')).toBeNull();
    const open = element.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement;
    expect(open.getAttribute('aria-expanded')).toBe('false');

    open.click();
    await fixture.whenStable();
    expect(element.querySelector('aside')).not.toBeNull();

    element.querySelector('aside')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(element.querySelector('aside')).toBeNull();
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
