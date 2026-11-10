export type VacancySize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type VacancyPriceUnit = 'HOUR' | 'DAY' | 'MONTH';

/** Modelo de exibição de um resultado da busca. Campos opcionais dependem do backend. */
export interface Vacancy {
  id: string;
  number: string;
  block: string | null;
  condominiumName: string;
  size: VacancySize | null;
  price: number | null;
  priceUnit: VacancyPriceUnit | null;
  available: boolean;
  imageUrl: string | null;
}

export const DEFAULT_PARKING_SPACE_IMAGE = '/images/default-parking-space.png';

export function hasUsableImageUrl(url: string | null | undefined): url is string {
  const value = url?.trim();
  return !!value && /^(https?:\/\/|\/(?!\/))/i.test(value);
}
