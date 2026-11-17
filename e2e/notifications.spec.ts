import type { Route } from '@playwright/test';
import { expect, test } from './fixtures';

const LIST = /\/api\/v1\/me\/notifications\?page=/;
const TOTAL = 25;
const SIZE = 20;

const rows = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(from + i).padStart(12, '0')}`,
    kind: 'RENTAL_REQUESTED',
    condominiumName: `Mock ${from + i}`,
    reason: null,
    createdAt: '2026-11-16T12:00:00Z',
    read: true,
  }));

function serve(route: Route) {
  const page = Number(new URL(route.request().url()).searchParams.get('page'));
  const items = page === 0 ? rows(1, SIZE) : rows(SIZE + 1, TOTAL - SIZE);
  return route.fulfill({
    contentType: 'application/json',
    headers: { 'X-Total-Count': String(TOTAL) },
    body: JSON.stringify(items),
  });
}

test('notifications: "Carregar mais" appends the next page and then disappears', async ({
  world,
  loginAs,
  shell,
  page,
}) => {
  await loginAs(world.owner.email);
  await page.route(LIST, serve);
  await shell.openNotifications();
  await expect(shell.notificationItems()).toHaveCount(SIZE);
  await shell.loadMore.click();
  await expect(shell.notificationItems()).toHaveCount(TOTAL);
  await expect(shell.loadMore).toHaveCount(0);
});

test('notifications: a failing next page shows the error in the panel', async ({
  world,
  loginAs,
  shell,
  page,
  guard,
}) => {
  guard.allowApi(500, LIST);
  guard.allowErrorAlerts();
  await loginAs(world.owner.email);
  await page.route(LIST, (route) =>
    new URL(route.request().url()).searchParams.get('page') === '0'
      ? serve(route)
      : route.fulfill({ status: 500, body: '{}' }),
  );
  await shell.openNotifications();
  await shell.loadMore.click();
  await expect(shell.notifications.locator('app-alert[data-kind="error"]')).toBeVisible();
});
