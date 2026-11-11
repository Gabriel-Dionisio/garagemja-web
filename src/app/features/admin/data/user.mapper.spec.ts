import { toUser } from './user.mapper';

describe('user mapper', () => {
  const admin = { id: 'u1', name: 'Ana', email: 'a@b.c', roles: ['ADMIN'], status: 'ACTIVE' };

  it('accepts an admin without cpf and phone', () => {
    expect(toUser(admin)).toEqual({ ...admin, cpf: null, phone: null });
  });

  it('keeps cpf and phone when present', () => {
    expect(toUser({ ...admin, cpf: '1', phone: '2' })).toMatchObject({ cpf: '1', phone: '2' });
  });
});
