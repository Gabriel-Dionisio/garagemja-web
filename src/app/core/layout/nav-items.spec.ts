import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  const paths = (items: { path: string }[]) => items.map((item) => item.path);

  it('morador: início, painel e condomínios, depois Alugar e Anunciar', () => {
    expect(paths(navItemsFor(['RESIDENT']))).toEqual([
      '/home',
      '/dashboard',
      '/condominiums',
      '/search',
      '/rentals',
      '/vehicles',
      '/parking-spots',
      '/requests',
      '/wallet',
    ]);
  });

  it('síndico: mesmo menu do morador', () => {
    expect(paths(navItemsFor(['CONDOMINIUM_ADMIN', 'RESIDENT']))).toEqual([
      '/home',
      '/dashboard',
      '/condominiums',
      '/search',
      '/rentals',
      '/vehicles',
      '/parking-spots',
      '/requests',
      '/wallet',
    ]);
  });

  it('ADMIN: painel, condomínios, carteira, usuários e auditoria, sem início', () => {
    expect(paths(navItemsFor(['ADMIN']))).toEqual([
      '/dashboard',
      '/condominiums',
      '/wallet',
      '/admin/users',
      '/admin/reviews',
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
