import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
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
      condominiums: this.http.get<CondominiumResponse[]>('/api/v1/condominiums'),
      spots: this.http.get<ParkingSpotResponse[]>('/api/v1/parking-spots?status=ACTIVE'),
      availabilities: this.http.get<SpotAvailabilityResponse[]>('/api/v1/spot-availabilities?active=true'),
    }).pipe(
      map(({ condominiums, spots, availabilities }) => {
        const spotById = new Map(spots.map((spot) => [spot.id, spot]));
        const availableByCondominium = new Map<string, { count: number; minPrice: number | null }>();

        for (const availability of availabilities.filter((item) => item.active)) {
          const spot = spotById.get(availability.parkingSpotId);
          if (!spot) continue;
          const current = availableByCondominium.get(spot.condominiumId) ?? { count: 0, minPrice: null };
          const price = Number(availability.price);
          current.count += 1;
          current.minPrice = current.minPrice == null ? price : Math.min(current.minPrice, price);
          availableByCondominium.set(spot.condominiumId, current);
        }

        return condominiums
          .flatMap((condominium) => {
            const availability = availableByCondominium.get(condominium.id);
            if (!availability || availability.minPrice == null) return [];
            const spot = spots.find((item) => item.condominiumId === condominium.id && item.imageUrl);
            return [{
              id: condominium.id,
              name: condominium.name,
              availableVagas: availability.count,
              pricePerHour: availability.minPrice,
              imageUrl: spot?.imageUrl || condominium.imageUrl || null,
            }];
          })
          .sort((a, b) => b.availableVagas - a.availableVagas);
      }),
    );
  }
}
