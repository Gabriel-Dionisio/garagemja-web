import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'garagemja-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<Theme>(this.initialTheme());
  readonly isDark = computed(() => this.theme() === 'dark');

  initialize(): void {
    this.apply(this.theme());
  }

  toggle(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.apply(next);

    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  private initialTheme(): Theme {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private apply(theme: Theme): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
  }
}
