import { defineConfig, devices } from '@playwright/test';

const headed = Boolean(process.env['E2E_HEADED']);
const managedApi = process.env['E2E_API'] === 'managed';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.results',
  workers: Number(process.env['E2E_WORKERS'] ?? 1),
  use: {
    baseURL: 'https://localhost:4300',
    ignoreHTTPSErrors: true,
    locale: 'pt-BR',
    headless: !headed,
    launchOptions: { slowMo: headed ? 250 : 0, args: headed ? ['--start-maximized'] : [] },
  },
  projects: [
    { name: 'desktop', use: { viewport: headed ? null : { width: 1280, height: 800 } } },
    {
      name: 'tablet',
      testMatch: /journey-.*\.spec\.ts/,
      use: { viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: 'mobile',
      testMatch: /journey-.*\.spec\.ts/,
      use: {
        viewport: devices['Pixel 7'].viewport,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: [
    {
      command: 'npx ng serve --port 4300',
      url: 'https://localhost:4300',
      reuseExistingServer: !process.env['CI'],
      ignoreHTTPSErrors: true,
      timeout: 120_000,
    },
    ...(managedApi
      ? [
          {
            command: 'node e2e/support/start-api.mjs',
            url: 'http://localhost:8080/api/v1/status',
            reuseExistingServer: false,
            gracefulShutdown: { signal: 'SIGTERM' as const, timeout: 30_000 },
            timeout: 240_000,
          },
        ]
      : []),
  ],
});
