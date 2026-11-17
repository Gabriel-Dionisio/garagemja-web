import type { Locator, Page } from '@playwright/test';
import { visit } from './visit';

const DRAWER_BELOW = 768;

export class ShellPage {
  readonly menu: Locator;
  readonly content: Locator;
  readonly notifications: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.menu = page.getByRole('navigation', { name: 'Principal' }).getByRole('link');
    this.content = page.locator('main > *:not(router-outlet)').first();
    this.notifications = page.getByRole('dialog', { name: 'Notificações' });
  }

  menuItem(name: string): Locator {
    return this.menu.filter({ hasText: name });
  }

  goto(path: string) {
    return visit(this.page, path);
  }

  async enter(): Promise<void> {
    await visit(this.page, '/');
  }

  async open(name: string): Promise<void> {
    const usesDrawer = (this.page.viewportSize()?.width ?? 1280) < DRAWER_BELOW;
    if (usesDrawer) await this.page.getByRole('button', { name: 'Abrir menu' }).click();
    await this.menuItem(name).click();
    await this.page.mouse.move((this.page.viewportSize()?.width ?? 1280) - 1, 300);
  }

  async openNotifications(): Promise<void> {
    await this.page.getByRole('button', { name: /^Notificações/ }).click();
    await this.notifications.waitFor();
  }

  hasHorizontalOverflow(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }
}
