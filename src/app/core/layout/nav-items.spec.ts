import { navItemsFor } from './nav-items';

describe('navItemsFor', () => {
  it('mostra itens de menu conforme os perfis', () => {
    expect(navItemsFor(['RESIDENT']).map((item) => item.path)).toEqual(['/home', '/rentals']);
    expect(navItemsFor(['ADMIN']).map((item) => item.path)).toEqual(['/home', '/admin/users']);
  });
});
