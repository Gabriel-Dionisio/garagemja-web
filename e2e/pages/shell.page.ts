import type { Locator, Page } from '@playwright/test';
import { visit } from './visit';

const SHEET_BELOW = 768;
const SHORT_NAME: Record<string, string> = {
  'Buscar vagas': 'Buscar',
  'Meus aluguéis': 'Aluguéis',
  'Pedidos recebidos': 'Pedidos',
};

export class ShellPage {
  readonly menu: Locator;
  readonly content: Locator;
  readonly notifications: Locator;
  readonly bell: Locator;
  readonly markAllRead: Locator;
  readonly loadMore: Locator;
  readonly closeNotificationsButton: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.menu = page.getByRole('navigation', { name: 'Principal' }).getByRole('link');
    this.content = page.locator('main > *:not(router-outlet)').first();
    this.notifications = page.getByRole('dialog', { name: 'Notificações' });
    this.bell = page.getByRole('button', { name: /^Notificações/ });
    this.markAllRead = this.notifications.getByRole('button', { name: 'Marcar todas como lidas' });
    this.loadMore = this.notifications.getByRole('button', { name: 'Carregar mais' });
    this.closeNotificationsButton = this.notifications.getByRole('button', {
      name: 'Fechar notificações',
    });
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
    const usesSheet = (this.page.viewportSize()?.width ?? 1280) < SHEET_BELOW;
    if (usesSheet) {
      const bottom = this.page.getByRole('navigation', { name: 'Navegação rápida' });
      await bottom.getByRole('button', { name: 'Mais' }).waitFor();
      const shortcut = bottom.getByRole('link', { name: SHORT_NAME[name] ?? name, exact: true });
      if (await shortcut.count()) return shortcut.click();
      await bottom.getByRole('button', { name: 'Mais' }).click();
    }
    await this.menuItem(name).click();
    await this.page.mouse.move((this.page.viewportSize()?.width ?? 1280) - 1, 300);
  }

  async openNotifications(): Promise<void> {
    await this.bell.click();
    await this.notifications.waitFor();
  }

  notificationItems(): Locator {
    return this.notifications.locator('button.item');
  }

  async unread(): Promise<number> {
    const bell = this.page.getByRole('button', { name: /^Notificações/, includeHidden: true });
    const name = (await bell.getAttribute('aria-label')) ?? '';
    return Number(/(\d+) não lidas/.exec(name)?.[1] ?? 0);
  }

  hasHorizontalOverflow(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }
}
