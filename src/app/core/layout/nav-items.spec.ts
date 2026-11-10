import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  it('mostra o menu de administração só para ADMIN', () => {
    expect(navItemsFor(['RESIDENT']).map((item) => item.path)).toEqual([
      '/home',
      '/search-vacancies',
      '/settings',
      '/profile',
    ]);
    expect(navItemsFor(['ADMIN']).map((item) => item.path)).toEqual([
      '/home',
      '/search-vacancies',
      '/admin/users',
      '/settings',
      '/profile',
    ]);
  });
});
