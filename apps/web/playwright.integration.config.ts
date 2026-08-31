import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-integration',
  timeout: 60_000,
  reporter: [['list'], ['junit', { outputFile: 'test-results/integration.xml' }]],
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://127.0.0.1:2345',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
