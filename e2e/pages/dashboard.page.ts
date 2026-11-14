import type { Locator, Page } from '@playwright/test';
import { visit } from './visit';

export class DashboardPage {
  readonly heading: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Painel', level: 1 });
  }

  goto() {
    return visit(this.page, '/dashboard');
  }
}
