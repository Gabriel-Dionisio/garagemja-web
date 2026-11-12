import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'garagemja-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<Theme>(this.initialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');
  private hasStoredChoice = this.storedTheme() !== null;

  constructor() {
    const query = this.document.defaultView?.matchMedia?.(DARK_QUERY);
    const follow = (event: MediaQueryListEvent) => {
      if (this.hasStoredChoice) return;
      this.select(event.matches ? 'dark' : 'light');
    };
    query?.addEventListener?.('change', follow);
    inject(DestroyRef).onDestroy(() => query?.removeEventListener?.('change', follow));
  }

  initialize(): void {
    this.apply(this.theme());
  }

  toggle(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.hasStoredChoice = true;
    this.select(next);

    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the choice then lasts only for this session.
    }
  }

  private select(theme: Theme): void {
    this.theme.set(theme);
    this.apply(theme);
  }

  private storedTheme(): Theme | null {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // Storage can be blocked; fall back to the system preference.
    }
    return null;
  }

  private initialTheme(): Theme {
    return (
      this.storedTheme() ??
      (this.document.defaultView?.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light')
    );
  }

  private apply(theme: Theme): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
  }
}
