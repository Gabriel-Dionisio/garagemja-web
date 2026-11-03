import { TestBed } from '@angular/core/testing';
import { LocaleService } from './locale-service';

describe('LocaleService', () => {
  afterEach(() => {
    document.cookie = 'lang=; Max-Age=0; Path=/';
  });

  it('lê o idioma salvo no cookie', () => {
    document.cookie = 'lang=en; Path=/';
    expect(TestBed.inject(LocaleService).language()).toBe('en');
  });

  it('ignora cookie inválido e usa o idioma do navegador', () => {
    document.cookie = 'lang=xx; Path=/';
    expect(['pt-BR', 'en']).toContain(TestBed.inject(LocaleService).language());
  });

  it('troca o idioma, atualiza o html e grava o cookie', () => {
    const locale = TestBed.inject(LocaleService);
    locale.set('en');
    TestBed.tick();
    expect(locale.language()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.cookie).toContain('lang=en');
  });
});
