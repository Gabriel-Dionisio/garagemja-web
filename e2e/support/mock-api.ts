import type { Page } from '@playwright/test';

export type Role = 'ADMIN' | 'CONDOMINIUM_ADMIN' | 'RESIDENT';

interface MockOptions {
  pendingResidents?: number;
  counts?: { residents: number; parkingSpots: number; activeRentals: number };
}

export async function mockApi(page: Page, role: Role, options: MockOptions = {}): Promise<void> {
  const { pendingResidents = 0, counts = { residents: 1, parkingSpots: 1, activeRentals: 0 } } =
    options;
  const json = (body: unknown) => ({ contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) {
      return route.fulfill(
        json({ id: 'u1', name: 'Teste', email: 'teste@example.test', roles: [role] }),
      );
    }
    if (path.endsWith('/me/managed-condominiums')) {
      return route.fulfill({
        ...json([{ id: 'c1', name: 'Edifício A', status: 'ACTIVE', pendingResidents }]),
        headers: { 'X-Total-Count': '1' },
      });
    }
    if (path.endsWith('/condominiums/c1')) {
      return route.fulfill(
        json({
          id: 'c1',
          name: 'Edifício A',
          cnpj: '11222333000181',
          status: 'ACTIVE',
          canManage: role === 'CONDOMINIUM_ADMIN',
          createdAt: '2026-11-01T10:00:00Z',
          contacts: [],
        }),
      );
    }
    if (path.endsWith('/me/notifications/unread-count')) return route.fulfill(json({ count: 0 }));
    if (path.endsWith('/me/notifications/stream')) {
      return route.fulfill({ contentType: 'text/event-stream', body: ': ok\n\n' });
    }
    if (path.endsWith('/summary'))
      return route.fulfill(json({ total: 0, active: 0, blocked: 0, pending: 0 }));
    if (path.endsWith('/stats/admin/monthly')) {
      return route.fulfill(json({ users: [], condominiums: [] }));
    }
    if (path.endsWith('/stats/manager/monthly')) {
      return route.fulfill(json({ residentRequests: [], rentals: [] }));
    }
    if (path.endsWith('/counts')) return route.fulfill(json(counts));
    if (path.endsWith('/images') || path.endsWith('/manager-invites')) {
      return route.fulfill(json([]));
    }
    if (route.request().method() !== 'GET') return route.fulfill({ status: 204 });
    return route.fulfill({ ...json([]), headers: { 'X-Total-Count': '0' } });
  });
}
