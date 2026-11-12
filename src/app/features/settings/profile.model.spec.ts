import { Profile, profileChanges } from './profile.model';

const current: Profile = {
  id: 'user-id',
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '16222222222',
  cpf: '12345678909',
  photoUrl: null,
};

describe('profileChanges', () => {
  it('returns nothing when the values are equivalent', () => {
    expect(profileChanges(current, 'Maria Silva', '(16) 22222-2222')).toEqual({});
  });

  it('returns only the name when only the name changed', () => {
    expect(profileChanges(current, 'Maria Souza', '(16) 22222-2222')).toEqual({
      name: 'Maria Souza',
    });
  });

  it('returns the phone as digits when it changed', () => {
    expect(profileChanges(current, 'Maria Silva', '(11) 98765-4321')).toEqual({
      phone: '11987654321',
    });
  });

  it('does not send an empty phone', () => {
    expect(profileChanges(current, 'Maria Silva', '')).toEqual({});
  });

  it('sends a phone for an account that had none', () => {
    expect(profileChanges({ ...current, phone: '' }, 'Maria Silva', '(11) 98765-4321')).toEqual({
      phone: '11987654321',
    });
  });
});
