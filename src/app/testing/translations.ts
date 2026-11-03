import { EnvironmentProviders, Injectable, inject, provideAppInitializer } from '@angular/core';
import {
  Translation,
  TranslocoLoader,
  TranslocoService,
  provideTransloco,
} from '@jsverse/transloco';
import { of } from 'rxjs';
import ptBR from '../../../public/i18n/pt-BR.json';

@Injectable()
class StaticLoader implements TranslocoLoader {
  getTranslation(_language: string) {
    return of<Translation>(ptBR);
  }
}

export function provideTestTranslations(): EnvironmentProviders[] {
  return [
    ...provideTransloco({
      config: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR', prodMode: true },
      loader: StaticLoader,
    }),
    provideAppInitializer(() => inject(TranslocoService).load('pt-BR')),
  ];
}
