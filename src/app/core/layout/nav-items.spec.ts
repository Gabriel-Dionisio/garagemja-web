import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  const paths = (items: { path: string }[]) => items.map((item) => item.path);

  it('morador: início, buscar vagas, condomínios, minhas vagas, meus aluguéis, solicitações, carteira, meus veículos e painel', () => {
    expect(paths(navItemsFor(['RESIDENT']))).toEqual([
      '/home',
      '/search-vacancies',
      '/condominiums',
      '/parking-spots',
      '/rentals',
      '/requests',
      '/wallet',
      '/vehicles',
      '/dashboard',
    ]);
  });

  it('síndico: início, buscar vagas, condomínios, minhas vagas, meus aluguéis, solicitações, carteira, meus veículos e painel', () => {
    expect(paths(navItemsFor(['CONDOMINIUM_ADMIN', 'RESIDENT']))).toEqual([
      '/home',
      '/search-vacancies',
      '/condominiums',
      '/parking-spots',
      '/rentals',
      '/requests',
      '/wallet',
      '/vehicles',
      '/dashboard',
    ]);
  });

  it('ADMIN: painel, condomínios, carteira, usuários e auditoria, sem início', () => {
    expect(paths(navItemsFor(['ADMIN']))).toEqual([
      '/dashboard',
      '/condominiums',
      '/wallet',
      '/admin/users',
      '/admin/audit-logs',
    ]);
  });
});

describe('NAV_ITEMS', () => {
  it('cada destino do morador tem ícone próprio', () => {
    const icons = navItemsFor(['RESIDENT', 'CONDOMINIUM_ADMIN']).map((item) => item.icon);
    expect(new Set(icons).size).toBe(icons.length);
    expect(navItemsFor(['RESIDENT']).find((item) => item.path === '/parking-spots')?.icon).toBe(
      'parking',
    );
    expect(navItemsFor(['RESIDENT']).find((item) => item.path === '/rentals')?.icon).toBe(
      'calendar',
    );
  });
});
