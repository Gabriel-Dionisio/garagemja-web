import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StatsApi, toRentalPoints } from './stats-api';

describe('StatsApi', () => {
  it('maps rental points and rejects malformed ones', () => {
    const body = { period: 'MONTH', points: [{ start: '2026-11', received: 3, made: 1 }] };
    expect(toRentalPoints(body)).toEqual([{ start: '2026-11', received: 3, made: 1 }]);
    expect(() =>
      toRentalPoints({ points: [{ start: '2026-11', received: '3', made: 1 }] }),
    ).toThrow();
    expect(() =>
      toRentalPoints({ points: [{ start: '11/2026', received: 3, made: 1 }] }),
    ).toThrow();
    expect(() => toRentalPoints(null)).toThrow();
  });

  it('asks my rentals by period', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(StatsApi);
    const http = TestBed.inject(HttpTestingController);
    api.myRentals('YEAR').subscribe();
    const request = http.expectOne((r) => r.url === '/api/v1/stats/me/rentals');
    expect(request.request.params.get('period')).toBe('YEAR');
    request.flush({ period: 'YEAR', points: [] });
    http.verify();
  });
});
