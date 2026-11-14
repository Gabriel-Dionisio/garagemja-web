import { toParkingSpot, toParkingSpotCondominium } from './parking-spot.mapper';

describe('parking spot mapper', () => {
  const base = { id: 's1', condominiumId: 'c1', number: '12', status: 'PENDING' };

  it('mapeia vaga com dono e descarta tamanho desconhecido', () => {
    const spot = toParkingSpot({
      ...base,
      size: 'HUGE',
      owner: { residentId: 'r1', name: 'Ana', unit: '12', block: null },
    });
    expect(spot.size).toBeNull();
    expect(spot.owner).toEqual({ residentId: 'r1', name: 'Ana', unit: '12', block: null });
  });

  it('rejeita status inválido', () => {
    expect(() => toParkingSpot({ ...base, status: 'DELETED' })).toThrow();
  });

  it('lê só o necessário do condomínio', () => {
    expect(
      toParkingSpotCondominium({
        id: 'c1',
        name: 'A',
        status: 'ACTIVE',
        canManage: true,
        cnpj: 'x',
      }),
    ).toEqual({ id: 'c1', name: 'A', status: 'ACTIVE', canManage: true });
  });
});
