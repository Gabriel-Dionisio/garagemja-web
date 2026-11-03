import { TestBed } from '@angular/core/testing';
import { provideTestTranslations } from './app/testing/translations';

beforeEach(() => {
  document.cookie = 'lang=pt-BR; Path=/';
  TestBed.configureTestingModule({ providers: provideTestTranslations() });
});
