import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LocaleService } from '../i18n/locale-service';
import { languageInterceptor } from './language-interceptor';

describe('languageInterceptor', () => {
  it('envia o idioma escolhido em Accept-Language', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([languageInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(LocaleService).language.set('en');
    TestBed.inject(HttpClient).get('/x').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/x');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
  });
});
