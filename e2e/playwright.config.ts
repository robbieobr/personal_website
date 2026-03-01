import { defineConfig, devices } from '@playwright/test';

/**
 * E2E test configuration targeting the Docker development stack.
 * Start the stack with `docker compose up` before running these tests.
 * Frontend: http://localhost:3000
 * Backend:  http://localhost:5000
 */
export default defineConfig({
  testDir: './tests',

  // Run tests sequentially — we're testing against a single shared Docker instance
  fullyParallel: false,
  workers: 1,

  // Retry once on CI to reduce flakiness from startup latency
  retries: process.env.CI ? 2 : 1,

  // Per-test timeout — generous to allow for Docker cold starts
  timeout: 30_000,

  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',

    // Capture screenshots and traces on failure for debugging
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
