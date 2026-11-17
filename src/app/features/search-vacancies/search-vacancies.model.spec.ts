import { convertToParamMap } from '@angular/router';
import {
  DEFAULT_CRITERIA,
  activeCriteriaCount,
  criteriaFromParams,
  criteriaToParams,
} from './search-vacancies.model';

describe('search-vacancies.model', () => {
  it('lê a URL e descarta valores inválidos', () => {
    const { criteria, page } = criteriaFromParams(
      convertToParamMap({
        q: 'sol',
        from: '2030-01-10',
        to: '2030-01-05',
        size: 'HUGE',
        sort: 'PRICE_DESC',
        min: '-3',
        max: '50',
        hourly: 'true',
        page: '2',
      }),
    );
    expect(criteria).toEqual({
      ...DEFAULT_CRITERIA,
      search: 'sol',
      from: '2030-01-10',
      hourly: true,
      maxPrice: 50,
      sort: 'PRICE_DESC',
    });
    expect(page).toBe(2);
  });

  it('ignora fim sem início e página inválida', () => {
    const { criteria, page } = criteriaFromParams(
      convertToParamMap({ to: '2030-01-05', page: 'x' }),
    );
    expect(criteria.to).toBe('');
    expect(page).toBe(0);
  });

  it('omite valores padrão ao montar a URL', () => {
    expect(criteriaToParams(DEFAULT_CRITERIA)).toEqual({
      q: null,
      from: null,
      to: null,
      size: null,
      hourly: null,
      covered: null,
      condominium: null,
      min: null,
      max: null,
      sort: null,
      page: null,
    });
  });

  it('lê vaga coberta e condomínio, ignorando condomínio inválido', () => {
    const id = '0198a7c2-1b2c-7d3e-8f40-123456789abc';
    const valid = criteriaFromParams(convertToParamMap({ covered: 'true', condominium: id }));
    expect(valid.criteria.covered).toBe(true);
    expect(valid.criteria.condominiumId).toBe(id);
    expect(
      criteriaFromParams(convertToParamMap({ condominium: 'x' })).criteria.condominiumId,
    ).toBeNull();
  });

  it('conta filtros ativos', () => {
    expect(activeCriteriaCount(DEFAULT_CRITERIA)).toBe(0);
    expect(
      activeCriteriaCount({ ...DEFAULT_CRITERIA, search: 'a', size: 'SMALL', maxPrice: 0 }),
    ).toBe(3);
  });
});
