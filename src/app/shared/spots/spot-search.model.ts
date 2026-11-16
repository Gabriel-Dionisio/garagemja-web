import { ParamMap, Params } from '@angular/router';
import { PARKING_SPOT_SIZES, ParkingSpotSize } from './parking-spot.model';

export const SPOT_SORTS = ['NUMBER', 'PRICE_ASC', 'PRICE_DESC'] as const;
export type SpotSort = (typeof SPOT_SORTS)[number];

export interface SpotCriteria {
  search: string;
  from: string;
  to: string;
  size: ParkingSpotSize | null;
  hourly: boolean;
  covered: boolean;
  condominiumId: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SpotSort;
}

export const DEFAULT_CRITERIA: SpotCriteria = {
  search: '',
  from: '',
  to: '',
  size: null,
  hourly: false,
  covered: false,
  condominiumId: null,
  minPrice: null,
  maxPrice: null,
  sort: 'NUMBER',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function price(value: string | null): number | null {
  const parsed = value === null || value === '' ? NaN : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function criteriaFromParams(params: ParamMap): { criteria: SpotCriteria; page: number } {
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const size = params.get('size');
  const sort = params.get('sort');
  const condominiumId = params.get('condominium') ?? '';
  const page = Number(params.get('page'));
  return {
    criteria: {
      search: params.get('q') ?? '',
      from: ISO_DATE.test(from) ? from : '',
      to: ISO_DATE.test(from) && ISO_DATE.test(to) && to >= from ? to : '',
      size: PARKING_SPOT_SIZES.find((value) => value === size) ?? null,
      hourly: params.get('hourly') === 'true',
      covered: params.get('covered') === 'true',
      condominiumId: UUID.test(condominiumId) ? condominiumId : null,
      minPrice: price(params.get('min')),
      maxPrice: price(params.get('max')),
      sort: SPOT_SORTS.find((value) => value === sort) ?? DEFAULT_CRITERIA.sort,
    },
    page: Number.isInteger(page) && page > 0 ? page : 0,
  };
}

export function criteriaToParams(criteria: SpotCriteria, page = 0): Params {
  return {
    q: criteria.search || null,
    from: criteria.from || null,
    to: criteria.to || null,
    size: criteria.size,
    hourly: criteria.hourly ? 'true' : null,
    covered: criteria.covered ? 'true' : null,
    condominium: criteria.condominiumId,
    min: criteria.minPrice,
    max: criteria.maxPrice,
    sort: criteria.sort === DEFAULT_CRITERIA.sort ? null : criteria.sort,
    page: page > 0 ? page : null,
  };
}

export function activeCriteriaCount(criteria: SpotCriteria): number {
  return [
    criteria.search,
    criteria.from,
    criteria.size,
    criteria.hourly,
    criteria.covered,
    criteria.condominiumId,
    criteria.minPrice !== null,
    criteria.maxPrice !== null,
    criteria.sort !== DEFAULT_CRITERIA.sort,
  ].filter(Boolean).length;
}
