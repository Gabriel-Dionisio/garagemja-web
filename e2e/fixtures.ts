import { expect, test as base, type APIRequestContext } from '@playwright/test';
import { LoginPage, RegisterPage } from './pages/auth.page';
import { CondominiumDetailPage, CondominiumsPage } from './pages/condominium.page';
import { DashboardPage } from './pages/dashboard.page';
import { MyRentalsPage } from './pages/my-rentals.page';
import { RequestsPage } from './pages/requests.page';
import {
  CondominiumSpotsPage,
  MyParkingSpotsPage,
  ParkingSpotFormPage,
  SpotAvailabilityPanel,
} from './pages/parking-spots.page';
import { ShellPage } from './pages/shell.page';
import { Api } from './support/api';
import { sessionFor } from './support/auth';
import { Guard } from './support/guard';
import { openWindow, resetWindow, type Window } from './support/window';
import { createWorld, type World } from './support/world';

interface Fixtures {
  recordTrace: void;
  guard: Guard;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  shell: ShellPage;
  condominiums: CondominiumsPage;
  condominiumDetail: CondominiumDetailPage;
  dashboard: DashboardPage;
  mySpots: MyParkingSpotsPage;
  condominiumSpots: CondominiumSpotsPage;
  spotForm: ParkingSpotFormPage;
  availability: SpotAvailabilityPanel;
  myRentals: MyRentalsPage;
  requests: RequestsPage;
  loginAs: (email: string) => Promise<void>;
  apiAs: (email: string) => Promise<Api>;
}

interface WorkerFixtures {
  window: Window;
  world: World;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  window: [
    async ({ browser }, use, workerInfo) => {
      const window = await openWindow(browser, workerInfo);
      await use(window);
      await window.context.close();
    },
    { scope: 'worker' },
  ],
  context: async ({ window }, use) => use(window.context),
  recordTrace: [
    async ({ window }, use, testInfo) => {
      await window.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
      await use();
      const failed = testInfo.status !== testInfo.expectedStatus;
      if (!failed && !process.env['E2E_UI']) {
        await window.context.tracing.stop();
        return;
      }
      const path = testInfo.outputPath('trace.zip');
      await window.context.tracing.stop({ path });
      await testInfo.attach('trace', { path, contentType: 'application/zip' });
    },
    { auto: true, scope: 'test' },
  ],
  page: async ({ window }, use) => {
    await resetWindow(window);
    await use(window.page);
    expect(await window.guard.problems(), 'unexpected errors while the user used the app').toEqual(
      [],
    );
  },
  guard: async ({ window }, use) => use(window.guard),
  world: [
    async ({}, use, workerInfo) => {
      const world = await createWorld(String(workerInfo.project.use.baseURL));
      await use(world);
      await world.dispose();
    },
    { scope: 'worker', timeout: 120_000 },
  ],
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  shell: async ({ page }, use) => use(new ShellPage(page)),
  condominiums: async ({ page }, use) => use(new CondominiumsPage(page)),
  condominiumDetail: async ({ page }, use) => use(new CondominiumDetailPage(page)),
  dashboard: async ({ page }, use) => use(new DashboardPage(page)),
  mySpots: async ({ page }, use) => use(new MyParkingSpotsPage(page)),
  condominiumSpots: async ({ page }, use) => use(new CondominiumSpotsPage(page)),
  spotForm: async ({ page }, use) => use(new ParkingSpotFormPage(page)),
  availability: async ({ page }, use) => use(new SpotAvailabilityPanel(page)),
  myRentals: async ({ page }, use) => use(new MyRentalsPage(page)),
  requests: async ({ page }, use) => use(new RequestsPage(page)),
  loginAs: async ({ page, baseURL }, use) => {
    await use(async (email) => {
      await page.context().addCookies((await sessionFor(email, baseURL)).cookies);
      await new ShellPage(page).enter();
    });
  },
  apiAs: async ({ playwright, baseURL }, use) => {
    const contexts: APIRequestContext[] = [];
    await use(async (email) => {
      const context = await playwright.request.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
        storageState: await sessionFor(email, baseURL),
      });
      contexts.push(context);
      return new Api(context);
    });
    await Promise.all(contexts.map((context) => context.dispose()));
  },
});

export { expect } from '@playwright/test';
