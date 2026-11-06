import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { FeaturedCondominium } from '../home.model';

interface CondominiumResponse {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface ParkingSpotResponse {
  id: string;
  condominiumId: string;
  imageUrl?: string | null;
}

interface SpotAvailabilityResponse {
  parkingSpotId: string;
  price: number | string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class HomeApi {
  private readonly http = inject(HttpClient);

  loadFeatured(): Observable<FeaturedCondominium[]> {
    return forkJoin({
      condominiums: this.http
        .get<CondominiumResponse[]>('/api/v1/condominiums')
        .pipe(catchError(() => of([]))),
      spots: this.http
        .get<ParkingSpotResponse[]>('/api/v1/parking-spots?status=ACTIVE')
        .pipe(catchError(() => of([]))),
      availabilities: this.http
        .get<SpotAvailabilityResponse[]>('/api/v1/spot-availabilities?active=true')
        .pipe(catchError(() => of([]))),
    }).pipe(
      map(({ condominiums, spots, availabilities }) => {
        const spotById = new Map(spots.map((spot) => [spot.id, spot]));
        const spotCountByCondominium = new Map<string, number>();
        const minPriceByCondominium = new Map<string, number>();

        for (const spot of spots) {
          spotCountByCondominium.set(
            spot.condominiumId,
            (spotCountByCondominium.get(spot.condominiumId) ?? 0) + 1,
          );
        }

        for (const availability of availabilities.filter((item) => item.active)) {
          const spot = spotById.get(availability.parkingSpotId);
          if (!spot) continue;
          const price = Number(availability.price);
          if (!Number.isFinite(price) || price <= 0) continue;
          const current = minPriceByCondominium.get(spot.condominiumId);
          if (current == null || price < current) {
            minPriceByCondominium.set(spot.condominiumId, price);
          }
        }

        return condominiums
          .flatMap((condominium) => {
            const availableVagas = spotCountByCondominium.get(condominium.id) ?? 0;
            if (availableVagas === 0) return [];
            const spot = spots.find((item) => item.condominiumId === condominium.id && item.imageUrl);
            return [{
              id: condominium.id,
              name: condominium.name,
              availableVagas,
              pricePerHour: minPriceByCondominium.get(condominium.id) ?? null,
              imageUrl: spot?.imageUrl || condominium.imageUrl || null,
            }];
          })
          .sort((a, b) => b.availableVagas - a.availableVagas);
      }),
    );
  }
}
