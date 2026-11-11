import { toList, toManager, toManagerInvite } from './manager.mapper';

describe('manager mapper', () => {
  it('maps a manager', () => {
    expect(toManager({ userId: 'u1', name: 'Ana', email: 'ana@example.test', extra: 1 })).toEqual({
      userId: 'u1',
      name: 'Ana',
      email: 'ana@example.test',
      showEmail: false,
    });
  });

  it('keeps the showEmail flag of a manager', () => {
    expect(
      toManager({ userId: 'u1', name: 'Ana', email: 'a@b.c', showEmail: true }).showEmail,
    ).toBe(true);
  });

  it('rejects a manager without email', () => {
    expect(() => toManager({ userId: 'u1', name: 'Ana' })).toThrow();
  });

  it('maps an invite and rejects a malformed one', () => {
    const invite = {
      id: 'i1',
      condominiumId: 'c1',
      condominiumName: 'Edifício A',
      invitedEmail: 'ana@example.test',
      requested: false,
      expiresAt: '2026-11-12T10:00:00Z',
    };
    expect(toManagerInvite(invite)).toEqual(invite);
    expect(() => toManagerInvite({ ...invite, expiresAt: 10 })).toThrow();
  });

  it('requires an array for lists', () => {
    expect(toList([{ userId: 'u1', name: 'Ana', email: 'a@b.c' }], toManager)).toHaveLength(1);
    expect(() => toList({}, toManager)).toThrow();
  });
});
