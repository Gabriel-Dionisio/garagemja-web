import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme-service';

const store = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
};

function createService(systemDark: boolean): ThemeService {
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({ matches: systemDark }) as MediaQueryList,
    configurable: true,
  });
  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', memoryStorage);
    Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset['theme'];
  });

  it('follows the system preference when nothing is stored', () => {
    expect(createService(true).theme()).toBe('dark');
  });

  it('prefers the stored choice over the system preference', () => {
    store.set('garagemja-theme', 'light');
    expect(createService(true).theme()).toBe('light');
  });

  it('ignores an invalid stored value', () => {
    store.set('garagemja-theme', 'blue');
    expect(createService(false).theme()).toBe('light');
  });

  it('toggles, applies and persists the theme', () => {
    const service = createService(false);
    service.toggle();
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(store.get('garagemja-theme')).toBe('dark');
  });
});
