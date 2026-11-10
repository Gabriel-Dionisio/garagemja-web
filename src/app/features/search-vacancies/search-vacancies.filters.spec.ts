import { filterAndSortVacancies, hasActiveFilters } from './search-vacancies.filters';
import { DEFAULT_CRITERIA, Vacancy, VacancyCriteria } from './search-vacancies.model';

const vacancy = (id: string, overrides: Partial<Vacancy> = {}): Vacancy => ({
  id,
  number: id,
  block: null,
  condominiumName: 'Residencial Alpha',
  address: 'Rua das Palmeiras, 100, São Paulo, SP',
  size: 'MEDIUM',
  price: 8,
  priceUnit: null,
  available: true,
  imageUrl: null,
  ...overrides,
});

const criteria = (overrides: Partial<VacancyCriteria> = {}): VacancyCriteria => ({
  ...DEFAULT_CRITERIA,
  ...overrides,
});

const ids = (list: Vacancy[]) => list.map((item) => item.id);

describe('filterAndSortVacancies', () => {
  const all = [
    vacancy('1', { price: 12, size: 'LARGE' }),
    vacancy('2', { price: 6, size: 'SMALL', available: false }),
    vacancy('3', {
      price: null,
      size: null,
      condominiumName: 'Edifício Beta',
      address: 'Av. Brasil, 50, Campinas, SP',
    }),
    vacancy('4', { price: 9, size: 'MEDIUM' }),
  ];

  it('ordena por menor preço por padrão, deixando vagas sem preço no fim', () => {
    expect(ids(filterAndSortVacancies(all, '', criteria()))).toEqual(['2', '4', '1', '3']);
  });

  it('ordena por maior preço, mantendo vagas sem preço no fim', () => {
    expect(ids(filterAndSortVacancies(all, '', criteria({ sort: 'PRICE_DESC' })))).toEqual([
      '1',
      '4',
      '2',
      '3',
    ]);
  });

  it('filtra por disponibilidade', () => {
    expect(ids(filterAndSortVacancies(all, '', criteria({ availability: 'AVAILABLE' })))).toEqual([
      '4',
      '1',
      '3',
    ]);
    expect(ids(filterAndSortVacancies(all, '', criteria({ availability: 'UNAVAILABLE' })))).toEqual([
      '2',
    ]);
  });

  it('filtra por tamanho', () => {
    expect(ids(filterAndSortVacancies(all, '', criteria({ size: 'SMALL' })))).toEqual(['2']);
    expect(ids(filterAndSortVacancies(all, '', criteria({ size: 'LARGE' })))).toEqual(['1']);
  });

  it('combina filtros, pesquisa e ordenação sem perder nenhum critério', () => {
    const result = filterAndSortVacancies(
      all,
      'alpha',
      criteria({ availability: 'AVAILABLE', sort: 'PRICE_DESC' }),
    );
    expect(ids(result)).toEqual(['1', '4']);
    expect(
      ids(filterAndSortVacancies(all, 'alpha', criteria({ availability: 'AVAILABLE', size: 'MEDIUM' }))),
    ).toEqual(['4']);
  });

  it('pesquisa por condomínio, endereço, número e bloco, sem diferenciar acentos e maiúsculas', () => {
    expect(ids(filterAndSortVacancies(all, 'EDIFICIO', criteria()))).toEqual(['3']);
    expect(ids(filterAndSortVacancies(all, 'campinas', criteria()))).toEqual(['3']);
    expect(ids(filterAndSortVacancies(all, 'sao paulo', criteria()))).toEqual(['2', '4', '1']);
    expect(
      ids(filterAndSortVacancies([vacancy('9', { block: 'Bloco A' })], 'bloco a', criteria())),
    ).toEqual(['9']);
  });

  it('exige todas as palavras da pesquisa', () => {
    expect(ids(filterAndSortVacancies(all, 'alpha campinas', criteria()))).toEqual([]);
  });

  it('não altera a lista original', () => {
    const copy = [...all];
    filterAndSortVacancies(all, '', criteria({ sort: 'PRICE_DESC' }));
    expect(all).toEqual(copy);
  });
});

describe('hasActiveFilters', () => {
  it('ignora a ordenação e considera disponibilidade e tamanho', () => {
    expect(hasActiveFilters(criteria())).toBe(false);
    expect(hasActiveFilters(criteria({ sort: 'PRICE_DESC' }))).toBe(false);
    expect(hasActiveFilters(criteria({ availability: 'AVAILABLE' }))).toBe(true);
    expect(hasActiveFilters(criteria({ size: 'SMALL' }))).toBe(true);
  });
});
