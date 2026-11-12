import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { fields, isNullableString } from '../../../shared/models/fields';
import { Residency, Vehicle, VehicleFields, VehicleListItem } from '../vehicle.model';

const VEHICLES_URL = '/api/v1/vehicles';
const RESIDENCIES_URL = '/api/v1/me/residencies';
const RESIDENCIES_LIMIT = 100;

export function toVehicle(value: unknown): Vehicle {
  const { id, residentId, plate, brand, model, color } = fields(value, 'vehicle');
  if (
    typeof id !== 'string' ||
    typeof residentId !== 'string' ||
    typeof plate !== 'string' ||
    !isNullableString(brand) ||
    !isNullableString(model) ||
    !isNullableString(color)
  ) {
    throw new Error('Invalid vehicle');
  }
  return {
    id,
    residentId,
    plate,
    brand: brand ?? null,
    model: model ?? null,
    color: color ?? null,
  };
}

export function toResidency(value: unknown): Residency {
  const { id, condominiumName, unit, block, status } = fields(value, 'residency');
  if (
    typeof id !== 'string' ||
    typeof condominiumName !== 'string' ||
    !isNullableString(unit) ||
    !isNullableString(block)
  ) {
    throw new Error('Invalid residency');
  }
  return {
    id,
    condominiumName,
    unit: unit ?? null,
    block: block ?? null,
    approved: status === 'APPROVED',
  };
}

@Injectable({ providedIn: 'root' })
export class VehiclesApi {
  private readonly http = inject(HttpClient);

  residencies(): Observable<Residency[]> {
    const params = new HttpParams().set('page', 0).set('size', RESIDENCIES_LIMIT);
    return this.http.get<unknown>(RESIDENCIES_URL, { params }).pipe(
      map((body) => {
        if (!Array.isArray(body)) throw new Error('Invalid residency list');
        return body.map(toResidency);
      }),
    );
  }

  listMine(): Observable<VehicleListItem[]> {
    return this.residencies().pipe(
      switchMap((residencies) =>
        residencies.length === 0
          ? of([])
          : forkJoin(
              residencies.map((residency) =>
                this.listByResident(residency.id).pipe(
                  map((vehicles) => vehicles.map((vehicle) => ({ ...vehicle, residency }))),
                ),
              ),
            ).pipe(map((groups) => groups.flat())),
      ),
    );
  }

  get(id: string): Observable<Vehicle> {
    return this.http.get<unknown>(`${VEHICLES_URL}/${id}`).pipe(map(toVehicle));
  }

  create(residentId: string, values: VehicleFields): Observable<Vehicle> {
    return this.http
      .post<unknown>(VEHICLES_URL, { residentId, ...optionalFields(values) })
      .pipe(map(toVehicle));
  }

  update(id: string, values: VehicleFields): Observable<Vehicle> {
    return this.http
      .patch<unknown>(`${VEHICLES_URL}/${id}`, {
        plate: values.plate,
        brand: values.brand.trim(),
        model: values.model.trim(),
        color: values.color.trim(),
      })
      .pipe(map(toVehicle));
  }

  private listByResident(residentId: string): Observable<Vehicle[]> {
    const params = new HttpParams().set('residentId', residentId);
    return this.http.get<unknown>(VEHICLES_URL, { params }).pipe(
      map((body) => {
        if (!Array.isArray(body)) throw new Error('Invalid vehicle list');
        return body.map(toVehicle);
      }),
    );
  }
}

function optionalFields({ plate, brand, model, color }: VehicleFields) {
  return {
    plate,
    brand: brand.trim() || undefined,
    model: model.trim() || undefined,
    color: color.trim() || undefined,
  };
}
