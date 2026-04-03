import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from e2e-sanity directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

export const BASE_URL = process.env.BASE_URL || 'https://bhairavapath.com';
export const API_URL  = process.env.API_URL  || 'https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/api/v1';

export default defineConfig({
  testDir: './tests/sanity',
  timeout: 60_000,
  expect:  { timeout: 15_000 },
  fullyParallel: true,
  retries: 1,
  workers: 2,

  reporter: [
    ['html', { outputFolder: 'reports/sanity-html', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace:   'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  projects: [
    {
      name: 'api-sanity',
      testMatch: /api-sanity\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ui-sanity',
      testMatch: /ui-sanity\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
