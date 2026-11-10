import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { Vacancy, VacancySize } from '../search-vacancies.model';

export interface ParkingSpotResponse {
  id: string;
  condominiumId: string;
  number: string;
  location: string | null;
  size: VacancySize | null;
}

export interface CondominiumResponse {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
}

export interface AvailabilityResponse {
  parkingSpotId: string;
  price: number | string;
  startDate: string;
  endDate: string;
  active: boolean;
}

function asList<T>(body: unknown): T[] {
  if (!Array.isArray(body)) throw new Error('Invalid list response');
  return body as T[];
}

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Disponibilidade ativa vigente em `today` (yyyy-MM-dd) ou, se não houver, a próxima a começar.
 * O backend impede períodos ativos sobrepostos na mesma vaga.
 */
function pickAvailability(
  availabilities: readonly AvailabilityResponse[],
  today: string,
): AvailabilityResponse | null {
  return (
    [...availabilities]
      .filter((item) => item.active && item.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null
  );
}

export function toVacancies(
  spots: readonly ParkingSpotResponse[],
  condominiums: readonly CondominiumResponse[],
  availabilities: readonly AvailabilityResponse[],
  today: string,
): Vacancy[] {
  const condominiumById = new Map(condominiums.map((condominium) => [condominium.id, condominium]));
  const availabilitiesBySpot = new Map<string, AvailabilityResponse[]>();
  for (const availability of availabilities) {
    const list = availabilitiesBySpot.get(availability.parkingSpotId) ?? [];
    list.push(availability);
    availabilitiesBySpot.set(availability.parkingSpotId, list);
  }

  return spots.flatMap((spot) => {
    const condominium = condominiumById.get(spot.condominiumId);
    if (!condominium) return [];
    const availability = pickAvailability(availabilitiesBySpot.get(spot.id) ?? [], today);
    const price = availability ? Number(availability.price) : NaN;
    return [
      {
        id: spot.id,
        number: spot.number,
        block: spot.location?.trim() || null,
        condominiumName: condominium.name,
        address:
          [condominium.address, condominium.city, condominium.state]
            .filter((part): part is string => !!part)
            .join(', ') || null,
        size: spot.size ?? null,
        price: Number.isFinite(price) ? price : null,
        // O backend não informa a unidade de cobrança; não é presumida.
        priceUnit: null,
        available: availability !== null,
        imageUrl: null,
      },
    ];
  });
}

/**
 * Hoje a API não pagina, ordena por preço nem filtra por tamanho/texto/cobertura. Por isso o
 * conjunto acessível ao usuário é carregado e filtrado no navegador (ver `filterAndSortVacancies`).
 * Quando o backend oferecer busca paginada, só esta classe precisa mudar.
 */
@Injectable({ providedIn: 'root' })
export class SearchVacanciesApi {
  private readonly http = inject(HttpClient);

  loadAll(): Observable<Vacancy[]> {
    return forkJoin({
      spots: this.http.get<unknown>('/api/v1/parking-spots', { params: { status: 'ACTIVE' } }),
      condominiums: this.http.get<unknown>('/api/v1/condominiums'),
      availabilities: this.http.get<unknown>('/api/v1/spot-availabilities', {
        params: { active: true },
      }),
    }).pipe(
      map(({ spots, condominiums, availabilities }) =>
        toVacancies(
          asList<ParkingSpotResponse>(spots),
          asList<CondominiumResponse>(condominiums),
          asList<AvailabilityResponse>(availabilities),
          localToday(),
        ),
      ),
    );
  }
}
