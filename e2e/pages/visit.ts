import type { Page } from '@playwright/test';

export async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path);
  const width = page.viewportSize()?.width ?? 1280;
  await page.mouse.move(width - 1, 300);
}
