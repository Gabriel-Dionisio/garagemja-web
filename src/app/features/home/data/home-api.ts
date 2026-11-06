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
        const spotCounts = new Map<string, number>();
        const prices = new Map<string, number>();

        for (const spot of spots) {
          spotCounts.set(spot.condominiumId, (spotCounts.get(spot.condominiumId) ?? 0) + 1);
        }

        for (const availability of availabilities) {
          const spot = spotById.get(availability.parkingSpotId);
          const price = Number(availability.price);
          if (!availability.active || !spot || !Number.isFinite(price) || price <= 0) continue;
          const current = prices.get(spot.condominiumId);
          if (current == null || price < current) prices.set(spot.condominiumId, price);
        }

        return condominiums
          .flatMap((condominium) => {
            const availableVagas = spotCounts.get(condominium.id) ?? 0;
            if (!availableVagas) return [];
            const spotImage = spots.find(
              (spot) => spot.condominiumId === condominium.id && !!spot.imageUrl,
            )?.imageUrl;
            return [{
              id: condominium.id,
              name: condominium.name,
              availableVagas,
              pricePerHour: prices.get(condominium.id) ?? null,
              imageUrl: spotImage || condominium.imageUrl || null,
            }];
          })
          .sort((a, b) => b.availableVagas - a.availableVagas);
      }),
    );
  }
}
