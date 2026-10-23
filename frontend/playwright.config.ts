import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Le suffixe sépare les tests navigateur des fichiers *.spec.ts de Vitest.
  testMatch: '**/*.pw.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  workers: process.env['CI'] ? 2 : undefined,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    locale: 'fr-FR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-320',
      use: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'mobile-390',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'tablet-768',
      use: { viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 1024 } } },
  ],
  webServer: {
    command: 'npm start -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
