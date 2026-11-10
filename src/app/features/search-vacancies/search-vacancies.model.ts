export const DEFAULT_PARKING_SPACE_IMAGE = '/images/default-parking-space.png';

export function hasUsableImageUrl(url: string | null | undefined): url is string {
  const value = url?.trim();
  return !!value && /^(https?:\/\/|\/(?!\/))/i.test(value);
}

export type VacancySize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type VacancyPriceUnit = 'HOUR' | 'DAY' | 'MONTH';

/** Modelo de exibição de um resultado da busca. Campos opcionais dependem do backend. */
export interface Vacancy {
  id: string;
  number: string;
  block: string | null;
  condominiumName: string;
  /** Endereço do condomínio (usado só na pesquisa por texto). */
  address: string | null;
  size: VacancySize | null;
  price: number | null;
  priceUnit: VacancyPriceUnit | null;
  available: boolean;
  imageUrl: string | null;
}

export type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
export type SizeFilter = 'ALL' | VacancySize;
export type VacancySort = 'PRICE_ASC' | 'PRICE_DESC';

/** Filtros e ordenação escolhidos na tela (a pesquisa por texto vem do campo da barra superior). */
export interface VacancyCriteria {
  availability: AvailabilityFilter;
  size: SizeFilter;
  sort: VacancySort;
}

export const DEFAULT_CRITERIA: VacancyCriteria = {
  availability: 'ALL',
  size: 'ALL',
  sort: 'PRICE_ASC',
};
