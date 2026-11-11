import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlatformSummaryApi } from './platform-summary-api';

describe('PlatformSummaryApi', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return {
      api: TestBed.inject(PlatformSummaryApi),
      http: TestBed.inject(HttpTestingController),
    };
  }

  it('reads user totals', () => {
    const { api, http } = setup();
    let result: unknown;
    api.users().subscribe((value) => (result = value));
    http.expectOne('/api/v1/users/summary').flush({ total: 3, active: 2, blocked: 1, extra: 9 });
    expect(result).toEqual({ total: 3, active: 2, blocked: 1 });
  });

  it('reads condominium totals', () => {
    const { api, http } = setup();
    let result: unknown;
    api.condominiums().subscribe((value) => (result = value));
    http.expectOne('/api/v1/condominiums/summary').flush({ total: 4, active: 2, pending: 1, blocked: 1 });
    expect(result).toEqual({ total: 4, active: 2, pending: 1, blocked: 1 });
  });

  it('rejects an invalid summary', () => {
    const { api, http } = setup();
    let failed = false;
    api.condominiums().subscribe({ error: () => (failed = true) });
    http.expectOne('/api/v1/condominiums/summary').flush({ total: 4, active: 2, blocked: 1 });
    expect(failed).toBe(true);
  });
});
