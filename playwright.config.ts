import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'backend',
      command: 'bun run test:e2e:backend',
      url: 'http://127.0.0.1:3101/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: '3101',
        SQLITE_PATH: 'data/playwright.sqlite',
        AUTH_SECRET: 'eventure-playwright-test-secret',
        DEMO_USER_PASSWORD: 'eventure123',
      },
    },
    {
      name: 'frontend',
      command: 'bun run test:e2e:frontend',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_URL: 'http://127.0.0.1:3101/api',
      },
    },
  ],
});
