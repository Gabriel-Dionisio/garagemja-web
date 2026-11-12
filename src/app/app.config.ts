import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth-service';
import { LocaleService } from './core/i18n/locale-service';
import { availabilityInterceptor } from './core/http/availability-interceptor';
import { languageInterceptor } from './core/http/language-interceptor';
import { refreshInterceptor } from './core/http/refresh-interceptor';
import { TranslatedTitleStrategy } from './core/i18n/title-strategy';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { ThemeService } from './core/theme/theme-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([languageInterceptor, availabilityInterceptor, refreshInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en'],
        defaultLang: 'pt-BR',
        fallbackLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    { provide: TitleStrategy, useExisting: TranslatedTitleStrategy },
    provideAppInitializer(() => inject(LocaleService).load()),
    provideAppInitializer(() => inject(ThemeService).initialize()),
    provideAppInitializer(() =>
      inject(AuthService)
        .loadSession()
        .pipe(catchError(() => of(null))),
    ),
  ],
};
