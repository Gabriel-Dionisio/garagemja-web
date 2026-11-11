import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EntityLookup } from './entity-lookup';

describe('EntityLookup', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { lookup: TestBed.inject(EntityLookup), http: TestBed.inject(HttpTestingController) };
  }

  it('maps users to options with the e-mail as detail', () => {
    const { lookup, http } = setup();
    let result: unknown;
    lookup.searchUsers('ma').subscribe((value) => (result = value));
    const request = http.expectOne((r) => r.url === '/api/v1/users');
    expect(request.request.params.get('email')).toBe('ma');
    expect(request.request.params.get('size')).toBe('5');
    request.flush([{ id: 'u1', name: 'Maria', email: 'm@x.com' }]);
    expect(result).toEqual([{ id: 'u1', label: 'Maria', detail: 'm@x.com' }]);
  });

  it('maps a condominium with the city as detail', () => {
    const { lookup, http } = setup();
    let result: unknown;
    lookup.condominium('c1').subscribe((value) => (result = value));
    http.expectOne('/api/v1/condominiums/c1').flush({ id: 'c1', name: 'Solar', city: 'Recife' });
    expect(result).toEqual({ id: 'c1', label: 'Solar', detail: 'Recife' });
  });

  it('rejects an invalid item', () => {
    const { lookup, http } = setup();
    let failed = false;
    lookup.searchCondominiums('so').subscribe({ error: () => (failed = true) });
    http.expectOne((r) => r.url === '/api/v1/condominiums').flush([{ id: 1 }]);
    expect(failed).toBe(true);
  });
});
