import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { RentalCard, RentalRecord } from '../rental.model';
import {
  toCondominiumDetails,
  toParkingSpotDetails,
  toRentalRecords,
  toResidentIds,
} from './rentals.mapper';

const RESIDENTS_URL = '/api/v1/residents';
const RENTALS_URL = '/api/v1/rentals';
const PARKING_SPOTS_URL = '/api/v1/parking-spots';
const CONDOMINIUMS_URL = '/api/v1/condominiums';

@Injectable({ providedIn: 'root' })
export class RentalsApi {
  private readonly http = inject(HttpClient);

  loadForUser(userId: string): Observable<RentalCard[]> {
    return this.http.get<unknown>(RESIDENTS_URL, { params: { userId } }).pipe(
      map((body) => [...new Set(toResidentIds(body, userId))]),
      switchMap((residentIds) => this.loadRecords(residentIds)),
      switchMap((records) => this.enrich(records)),
    );
  }

  private loadRecords(residentIds: string[]): Observable<RentalRecord[]> {
    if (residentIds.length === 0) return of([]);
    return forkJoin(
      residentIds.map((residentId) =>
        this.http
          .get<unknown>(RENTALS_URL, { params: { renterResidentId: residentId } })
          .pipe(map(toRentalRecords)),
      ),
    ).pipe(map((groups) => groups.flat()));
  }

  private enrich(records: RentalRecord[]): Observable<RentalCard[]> {
    if (records.length === 0) return of([]);

    const parkingSpotIds = [...new Set(records.map((record) => record.parkingSpotId))];
    const condominiumIds = [...new Set(records.map((record) => record.condominiumId))];

    return forkJoin({
      parkingSpots: forkJoin(
        parkingSpotIds.map((id) =>
          this.http
            .get<unknown>(`${PARKING_SPOTS_URL}/${id}`)
            .pipe(map((body) => toParkingSpotDetails(body, id))),
        ),
      ),
      condominiums: forkJoin(
        condominiumIds.map((id) =>
          this.http
            .get<unknown>(`${CONDOMINIUMS_URL}/${id}`)
            .pipe(map((body) => toCondominiumDetails(body, id))),
        ),
      ),
    }).pipe(
      map(({ parkingSpots, condominiums }) => {
        const spotsById = new Map(parkingSpots.map((spot) => [spot.id, spot]));
        const condominiumsById = new Map(
          condominiums.map((condominium) => [condominium.id, condominium]),
        );
        return records
          .map((record) => {
            const spot = spotsById.get(record.parkingSpotId);
            const condominium = condominiumsById.get(record.condominiumId);
            if (!spot || !condominium) throw new Error('Rental details are incomplete');
            return {
              ...record,
              parkingSpotNumber: spot.number,
              parkingSpotLocation: spot.location,
              condominiumName: condominium.name,
            };
          })
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      }),
    );
  }
}
