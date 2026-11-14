import type { Locator, Page } from '@playwright/test';

export class FilteredList {
  readonly list: Locator;
  readonly items: Locator;
  readonly empty: Locator;
  protected readonly page: Page;
  private readonly filtersToggle: Locator;

  constructor(page: Page, listName: string, filtersLabel = 'Filtros') {
    this.page = page;
    this.list = page.getByRole('list', { name: listName, exact: true });
    this.items = this.list.getByRole('listitem');
    this.empty = page.getByRole('heading', { name: /Nenhum|ainda não/ });
    this.filtersToggle = page.getByRole('button', { name: new RegExp(`^${filtersLabel}`) });
  }

  async openFilters(): Promise<void> {
    if ((await this.filtersToggle.getAttribute('aria-expanded')) !== 'true') {
      await this.filtersToggle.click();
    }
  }

  async choose(groupLabel: string, option: string): Promise<void> {
    await this.openFilters();
    await this.page
      .getByRole('group', { name: groupLabel })
      .getByRole('button', { name: option, exact: true })
      .click();
  }

  item(text: string): Locator {
    return this.items.filter({ hasText: text });
  }
}
