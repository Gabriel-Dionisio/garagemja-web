import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export const LANGUAGES = ['pt-BR', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const COOKIE = 'lang';
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value);
}

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);

  readonly language = signal<Language>(this.initial());

  constructor() {
    this.transloco.setActiveLang(this.language());
    effect(() => {
      const language = this.language();
      this.transloco.setActiveLang(language);
      this.document.documentElement.lang = language;
    });
  }

  load() {
    return this.transloco.load(this.language());
  }

  set(language: Language): void {
    this.language.set(language);
    this.document.cookie = `${COOKIE}=${language}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${this.secureFlag()}`;
  }

  private secureFlag(): string {
    return this.document.location.protocol === 'https:' ? '; Secure' : '';
  }

  private initial(): Language {
    const stored = this.document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    if (isLanguage(stored)) return stored;
    const preferred = this.document.defaultView?.navigator.language ?? '';
    return preferred.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';
  }
}
