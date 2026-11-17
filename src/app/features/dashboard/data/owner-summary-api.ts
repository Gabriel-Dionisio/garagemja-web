import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields } from '../../../shared/models/fields';
import { OwnerSummary } from '../owner-summary.model';

const SUMMARY_URL = '/api/v1/me/owned-rentals/summary';

function toSummary(value: unknown): OwnerSummary {
  const row = fields(value);
  const summary = {
    spots: Number(row['spots']),
    pending: Number(row['pending']),
    active: Number(row['active']),
    upcoming: Number(row['upcoming']),
    monthEarnings: Number(row['monthEarnings']),
  };
  if (Object.values(summary).some((item) => !Number.isFinite(item))) {
    throw new Error('Invalid rental summary');
  }
  return summary;
}

@Injectable({ providedIn: 'root' })
export class OwnerSummaryApi {
  private readonly http = inject(HttpClient);

  summary(): Observable<OwnerSummary> {
    return this.http.get<unknown>(SUMMARY_URL).pipe(map(toSummary));
  }
}
