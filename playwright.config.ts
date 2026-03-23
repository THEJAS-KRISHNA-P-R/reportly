import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 }
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-1366',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'tablet-portrait',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 820, height: 1180 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 740 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
