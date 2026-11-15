import type { Page } from '@playwright/test';

interface Allowed {
  status: number;
  url: RegExp;
}

const DEFAULT_ALLOWED: Allowed[] = [
  { status: 401, url: /\/api\/v1\/auth\/(me|refresh)$/ },
  { status: 404, url: /brasilapi\.com\.br\/api\/cnpj\// },
];

const guards = new WeakMap<Page, Guard>();

export class Guard {
  static watch(page: Page): Guard {
    const guard = new Guard(page);
    guards.set(page, guard);
    return guard;
  }

  static of(page: Page): Guard {
    const guard = guards.get(page);
    if (!guard) throw new Error('Page is not watched by a Guard');
    return guard;
  }

  async check(): Promise<string[]> {
    const problems = await this.problems();
    this.found.length = 0;
    return problems;
  }

  private readonly found: string[] = [];
  private allowed: Allowed[] = [...DEFAULT_ALLOWED];
  private alertsAllowed = false;
  private readonly page: Page;

  private constructor(page: Page) {
    this.page = page;
    page.on('console', (message) => {
      const text = message.text();
      if (!['error', 'warning'].includes(message.type())) return;
      if (text.startsWith('Failed to load resource')) return;
      if (/^Mixed Content:.*http:\/\/localhost:9000\//.test(text)) return;
      this.found.push(`console.${message.type()}: ${text}`);
    });
    page.on('pageerror', (error) => this.found.push(`pageerror: ${error.message}`));
    page.on('response', (response) => {
      const url = response.url();
      if (!url.includes('/api/') || response.status() < 400) return;
      if (this.allowed.some((a) => a.status === response.status() && a.url.test(url))) return;
      this.found.push(`${response.request().method()} ${url} -> ${response.status()}`);
    });
  }

  reset(): void {
    this.found.length = 0;
    this.allowed = [...DEFAULT_ALLOWED];
    this.alertsAllowed = false;
  }

  allowApi(status: number, url: RegExp): void {
    this.allowed.push({ status, url });
  }

  allowErrorAlerts(): void {
    this.alertsAllowed = true;
  }

  async problems(): Promise<string[]> {
    if (this.alertsAllowed || this.page.isClosed()) return this.found;
    const alerts = await this.page.locator('app-alert[data-kind="error"]').allInnerTexts();
    return [...this.found, ...alerts.map((text) => `error alert on screen: ${text.trim()}`)];
  }
}
