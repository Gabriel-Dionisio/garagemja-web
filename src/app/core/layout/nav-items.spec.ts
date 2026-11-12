import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  const paths = (items: { path: string }[]) => items.map((item) => item.path);

  it('morador: início, condomínios e meus aluguéis', () => {
    expect(paths(navItemsFor(['RESIDENT']))).toEqual(['/home', '/condominiums', '/rentals']);
  });

  it('síndico: início, condomínios, meus aluguéis e painel', () => {
    expect(paths(navItemsFor(['CONDOMINIUM_ADMIN', 'RESIDENT']))).toEqual([
      '/home',
      '/condominiums',
      '/rentals',
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
