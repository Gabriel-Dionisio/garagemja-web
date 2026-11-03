import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { STATUS_URL } from '../../../core/http/api-availability';
import { BucketState, ServiceStatus, StatusHistory } from '../status.model';

const STATUS_HISTORY_URL = `${STATUS_URL}/history`;

function toStatus(value: unknown, latencyMs: number): ServiceStatus | null {
  if (typeof value !== 'object' || value === null) return null;
  const { status, version, components } = Object.fromEntries(Object.entries(value));
  if (status !== 'UP' && status !== 'DOWN') return null;
  const entries =
    typeof components === 'object' && components !== null ? Object.entries(components) : [];
  return {
    state: status === 'UP' ? 'up' : 'down',
    version: typeof version === 'string' ? version : null,
    components: entries.map(([name, state]) => ({ name, up: state === 'UP' })),
    latencyMs,
    checkedAt: new Date(),
  };
}

const BUCKET_STATES: Record<string, BucketState> = {
  UP: 'up',
  DEGRADED: 'degraded',
  DOWN: 'down',
  NO_DATA: 'noData',
};

function toHistory(value: unknown): StatusHistory | null {
  if (typeof value !== 'object' || value === null) return null;
  const { bucketMinutes, uptimePercent, buckets } = Object.fromEntries(Object.entries(value));
  if (typeof bucketMinutes !== 'number' || !Array.isArray(buckets)) return null;
  const parsed: StatusHistory['buckets'] = [];
  for (const bucket of buckets) {
    const { start, state } = Object.fromEntries(Object.entries(bucket ?? {}));
    const date = new Date(String(start));
    const mapped = typeof state === 'string' ? BUCKET_STATES[state] : undefined;
    if (!mapped || Number.isNaN(date.getTime())) return null;
    parsed.push({ start: date, state: mapped });
  }
  return {
    bucketMinutes,
    uptimePercent: typeof uptimePercent === 'number' ? uptimePercent : null,
    buckets: parsed,
  };
}

const UNREACHABLE: () => ServiceStatus = () => ({
  state: 'unreachable',
  version: null,
  components: [],
  latencyMs: null,
  checkedAt: new Date(),
});

@Injectable({ providedIn: 'root' })
export class StatusApi {
  private readonly http = inject(HttpClient);

  load(): Observable<ServiceStatus> {
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);
    return this.http.get<unknown>(STATUS_URL).pipe(
      map((body) => toStatus(body, elapsed()) ?? UNREACHABLE()),
      catchError((error: unknown) =>
        of(
          error instanceof HttpErrorResponse
            ? (toStatus(error.error, elapsed()) ?? UNREACHABLE())
            : UNREACHABLE(),
        ),
      ),
    );
  }

  history(): Observable<StatusHistory | null> {
    return this.http.get<unknown>(STATUS_HISTORY_URL).pipe(
      map(toHistory),
      catchError(() => of(null)),
    );
  }
}
