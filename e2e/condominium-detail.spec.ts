import { expect, test } from './fixtures';
import { mockApi } from './support/mock-api';

for (const width of [375, 768, 1280]) {
  test(`admin moderation view at ${width}px`, async ({ page, condominiumDetail, shell }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page, 'ADMIN', { counts: { residents: 12, parkingSpots: 7, activeRentals: 3 } });
    await condominiumDetail.goto('c1');
    await expect(condominiumDetail.count('Moradores')).toHaveText('12');
    await expect(condominiumDetail.tab('Histórico')).toBeVisible();
    expect(await shell.hasHorizontalOverflow()).toBe(false);
    await page.mouse.move(width - 1, 450);
    await page.screenshot({ path: `e2e/.results/detail-${width}.png`, fullPage: false });
  });
}
