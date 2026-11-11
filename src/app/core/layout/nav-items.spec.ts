import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  const paths = (items: { path: string }[]) => items.map((item) => item.path);

  it('morador: início e condomínios', () => {
    expect(paths(navItemsFor(['RESIDENT']))).toEqual([
      '/home',
      '/condominiums',
      '/settings',
      '/profile',
    ]);
  });

  it('síndico: início, condomínios e painel', () => {
    expect(paths(navItemsFor(['CONDOMINIUM_ADMIN', 'RESIDENT']))).toEqual([
      '/home',
      '/condominiums',
      '/dashboard',
      '/settings',
      '/profile',
    ]);
  });

  it('ADMIN: painel, condomínios, usuários e auditoria, sem início', () => {
    expect(paths(navItemsFor(['ADMIN']))).toEqual([
      '/dashboard',
      '/condominiums',
      '/admin/users',
      '/admin/audit-logs',
      '/settings',
      '/profile',
    ]);
  });
});
