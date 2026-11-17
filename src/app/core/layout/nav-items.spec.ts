import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  const paths = (items: { path: string }[]) => items.map((item) => item.path);

  it('morador: início, condomínios, minhas vagas, meus aluguéis, solicitações, meus veículos e painel', () => {
    expect(paths(navItemsFor(['RESIDENT']))).toEqual([
      '/home',
      '/condominiums',
      '/parking-spots',
      '/rentals',
      '/requests',
      '/vehicles',
      '/dashboard',
    ]);
  });

  it('síndico: início, condomínios, minhas vagas, meus aluguéis, solicitações, meus veículos e painel', () => {
    expect(paths(navItemsFor(['CONDOMINIUM_ADMIN', 'RESIDENT']))).toEqual([
      '/home',
      '/condominiums',
      '/parking-spots',
      '/rentals',
      '/requests',
      '/vehicles',
      '/dashboard',
    ]);
  });

  it('ADMIN: painel, condomínios, usuários e auditoria, sem início', () => {
    expect(paths(navItemsFor(['ADMIN']))).toEqual([
      '/dashboard',
      '/condominiums',
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
