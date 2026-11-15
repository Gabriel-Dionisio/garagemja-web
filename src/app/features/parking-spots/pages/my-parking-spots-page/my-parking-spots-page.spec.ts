import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { ParkingSpotsApi } from '../../data/parking-spots-api';
import { ParkingSpot } from '../../parking-spot.model';
import { MyParkingSpotsPage } from './my-parking-spots-page';

const spot = (overrides: Partial<ParkingSpot> = {}): ParkingSpot => ({
  id: 's1',
  condominiumId: 'c1',
  ownerResidentId: 'r1',
  owner: null,
  condominiumName: 'Edifício A',
  availability: null,
  number: '23',
  location: null,
  size: null,
  status: 'PENDING',
  statusReason: null,
  imageUrl: null,
  thumbnailUrl: null,
  ...overrides,
});

describe('MyParkingSpotsPage', () => {
  async function setup(items: ParkingSpot[], total = items.length) {
    const list = vi.fn((_id: string | null, _filter: unknown, page: number, size: number) =>
      of(toPage(items, page, size, total)),
    );
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ParkingSpotsApi, useValue: { list } }],
    });
    const fixture = TestBed.createComponent(MyParkingSpotsPage);
    await fixture.whenStable();
    return { fixture, list, element: fixture.nativeElement as HTMLElement };
  }

  async function search(fixture: ComponentFixture<MyParkingSpotsPage>, term: string) {
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('app-parking-spot-filter input');
    if (!input) throw new Error('search input missing');
    input.value = term;
    input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('app-parking-spot-filter [type="submit"]')?.click();
    await fixture.whenStable();
  }

  it('conta status, tamanho e busca como filtros ativos e envia os três', async () => {
    const { fixture, list, element } = await setup([spot()]);
    expect(element.querySelector('app-filter-panel .count')).toBeNull();

    const groups = element.querySelectorAll('app-chip-group');
    groups[0].querySelectorAll<HTMLButtonElement>('button')[1].click();
    groups[1].querySelectorAll<HTMLButtonElement>('button')[1].click();
    await search(fixture, ' 23 ');

    expect(element.querySelector('app-filter-panel .count')?.textContent?.trim()).toBe('3');
    expect(list).toHaveBeenLastCalledWith(
      null,
      { status: 'PENDING', size: 'SMALL', search: '23', mine: true },
      0,
      expect.any(Number),
    );
  });

  it('nova busca volta para a primeira página', async () => {
    const { fixture, list, element } = await setup([spot()], 100);
    element.querySelector<HTMLButtonElement>('app-paginator button[aria-label="Próxima"]')?.click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(null, expect.anything(), 1, expect.any(Number));

    await search(fixture, 'A');
    expect(list).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ search: 'A' }),
      0,
      expect.any(Number),
    );
  });

  it('lista só as vagas do morador com contador e badge', async () => {
    const { list, element } = await setup([
      spot(),
      spot({
        id: 's2',
        number: '24',
        status: 'ACTIVE',
        availability: {
          dailyPrice: 8,
          hourlyPrice: null,
          startDate: '2026-10-01',
          endDate: '2026-12-31',
        },
      }),
    ]);
    expect(list).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ mine: true }),
      0,
      expect.any(Number),
    );
    const text = element.textContent ?? '';
    expect(text).toContain('2 vaga(s) cadastrada(s)');
    expect(text).toContain('Edifício A');
    expect(text).toContain('Pendente');
    expect(text).toContain('Disponível');
  });
});
