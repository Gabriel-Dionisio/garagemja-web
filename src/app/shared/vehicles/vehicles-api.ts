import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { fields, isNullableString } from '../models/fields';
import { Page, toResponsePage } from '../models/page';
import { Residency, Vehicle, VehicleFields, VehicleListItem } from './vehicle.model';

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
  const { id, condominiumId, condominiumName, unit, block, status } = fields(value, 'residency');
  if (
    typeof id !== 'string' ||
    typeof condominiumId !== 'string' ||
    typeof condominiumName !== 'string' ||
    !isNullableString(unit) ||
    !isNullableString(block)
  ) {
    throw new Error('Invalid residency');
  }
  return {
    id,
    condominiumId,
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

  list(search: string, page: number, size: number): Observable<Page<VehicleListItem>> {
    let params = new HttpParams().set('mine', true).set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return forkJoin({
      residencies: this.residencies(),
      response: this.http.get<unknown>(VEHICLES_URL, { params, observe: 'response' }),
    }).pipe(
      map(({ residencies, response }) => {
        if (!Array.isArray(response.body)) throw new Error('Invalid vehicle list');
        const byId = new Map(residencies.map((residency) => [residency.id, residency]));
        const items = response.body.map(toVehicle).map((vehicle) => ({
          ...vehicle,
          residency: byId.get(vehicle.residentId) ?? null,
        }));
        return toResponsePage(response, items, page, size);
      }),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${VEHICLES_URL}/${id}`);
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
}

function optionalFields({ plate, brand, model, color }: VehicleFields) {
  return {
    plate,
    brand: brand.trim() || undefined,
    model: model.trim() || undefined,
    color: color.trim() || undefined,
  };
}
