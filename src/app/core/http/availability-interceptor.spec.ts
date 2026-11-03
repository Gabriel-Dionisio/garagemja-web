import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiAvailability } from './api-availability';
import { REPORT_ONLY } from './availability-context';
import { availabilityInterceptor } from './availability-interceptor';

describe('availabilityInterceptor', () => {
  const report = vi.fn();
  const reportAndWait = vi.fn();
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    report.mockReset();
    reportAndWait.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([availabilityInterceptor])),
        provideHttpClientTesting(),
        { provide: ApiAvailability, useValue: { report, reportAndWait } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const badGateway = { status: 502, statusText: 'Bad Gateway' };

  it('ignora falhas das rotas de status, inclusive o histórico', () => {
    client.get('/api/v1/status').subscribe({ error: () => undefined });
    client.get('/api/v1/status/history').subscribe({ error: () => undefined });

    http.expectOne('/api/v1/status').flush(null, badGateway);
    http.expectOne('/api/v1/status/history').flush(null, badGateway);

    expect(report).not.toHaveBeenCalled();
    expect(reportAndWait).not.toHaveBeenCalled();
  });

  it('só avisa e propaga o erro quando a requisição pede REPORT_ONLY', () => {
    let status = 0;
    client
      .get('/api/v1/auth/me', { context: new HttpContext().set(REPORT_ONLY, true) })
      .subscribe({ error: (error) => (status = error.status) });

    http.expectOne('/api/v1/auth/me').flush(null, badGateway);

    expect(status).toBe(502);
    expect(report).toHaveBeenCalledOnce();
    expect(reportAndWait).not.toHaveBeenCalled();
  });
});
