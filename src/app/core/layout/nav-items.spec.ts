import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  it('mostra o menu de administração só para ADMIN', () => {
    expect(navItemsFor(['RESIDENT']).map((item) => item.path)).toEqual(['/home', '/settings']);
    expect(navItemsFor(['ADMIN']).map((item) => item.path)).toEqual([
      '/home',
      '/admin/users',
      '/settings',
    ]);
  });
});
