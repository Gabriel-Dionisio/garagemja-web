import type { Browser, BrowserContext, Page, WorkerInfo } from '@playwright/test';
import { clickMarkerScript } from './click-marker';
import { Guard } from './guard';

export interface Window {
  context: BrowserContext;
  page: Page;
  guard: Guard;
}

export async function openWindow(browser: Browser, info: WorkerInfo): Promise<Window> {
  const { baseURL, viewport, isMobile, hasTouch, deviceScaleFactor } = info.project.use;
  const context = await browser.newContext({
    baseURL,
    viewport,
    isMobile,
    hasTouch,
    deviceScaleFactor,
    ignoreHTTPSErrors: true,
    locale: 'pt-BR',
  });
  await mockBrazilLookups(context);
  if (process.env['E2E_HEADED'] || process.env['E2E_UI'])
    await context.addInitScript(clickMarkerScript);
  const page = await context.newPage();
  return { context, page, guard: Guard.watch(page) };
}

export async function resetWindow({ context, page, guard }: Window): Promise<void> {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await context.clearCookies();
  if (page.url() !== 'about:blank') await page.goto('/login');
  guard.reset();
}

async function mockBrazilLookups(context: BrowserContext): Promise<void> {
  await context.route('https://brasilapi.com.br/api/cep/**', (route) =>
    route.fulfill({
      json: {
        street: 'Avenida Paulista',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      },
    }),
  );
  await context.route('https://brasilapi.com.br/api/cnpj/**', (route) =>
    route.fulfill({ status: 404, json: { message: 'CNPJ não encontrado' } }),
  );
}
