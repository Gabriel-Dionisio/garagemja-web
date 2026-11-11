import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.results',
  use: { baseURL: 'https://localhost:4300', ignoreHTTPSErrors: true, locale: 'pt-BR' },
  webServer: {
    command: 'npx ng serve --port 4300',
    url: 'https://localhost:4300',
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
  },
});
