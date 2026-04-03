import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Bhairavapath.com — End-to-End Sanity Test Suite
 * Covers all 39 stories across 18 epics
 */

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const API_URL  = process.env.API_URL  || 'http://localhost:4000';

export const STORAGE_STATE = {
  admin:   path.join(__dirname, '.auth/admin.json'),
  user:    path.join(__dirname, '.auth/user.json'),
  noAuth:  path.join(__dirname, '.auth/noauth.json'),
};

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect:  { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace:   'on-first-retry',
    screenshot: 'only-on-failure',
    video:   'retain-on-failure',
  },

  projects: [
    // ── Setup ──────────────────────────────────────────────────────────
    {
      name: 'setup:seed',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'setup:auth-admin',
      testMatch: /auth\.admin\.setup\.ts/,
      dependencies: ['setup:seed'],
    },
    {
      name: 'setup:auth-user',
      testMatch: /auth\.user\.setup\.ts/,
      dependencies: ['setup:seed'],
    },

    // ── Chrome (authenticated user) ────────────────────────────────────
    {
      name: 'chromium:user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE.user,
      },
      dependencies: ['setup:auth-user'],
      testIgnore: [/admin\//, /setup\//],
    },

    // ── Chrome (authenticated admin) ───────────────────────────────────
    {
      name: 'chromium:admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE.admin,
      },
      dependencies: ['setup:auth-admin'],
      testMatch: /admin\//,
    },

    // ── Firefox ────────────────────────────────────────────────────────
    {
      name: 'firefox:user',
      use: {
        ...devices['Desktop Firefox'],
        storageState: STORAGE_STATE.user,
      },
      dependencies: ['setup:auth-user'],
      testIgnore: [/admin\//, /setup\//],
    },

    // ── Safari / WebKit ────────────────────────────────────────────────
    {
      name: 'webkit:user',
      use: {
        ...devices['Desktop Safari'],
        storageState: STORAGE_STATE.user,
      },
      dependencies: ['setup:auth-user'],
      testIgnore: [/admin\//, /setup\//],
    },

    // ── Mobile Chrome ──────────────────────────────────────────────────
    {
      name: 'mobile:chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: STORAGE_STATE.user,
      },
      dependencies: ['setup:auth-user'],
      testIgnore: [/admin\//, /setup\//],
    },

    // ── Mobile Safari ──────────────────────────────────────────────────
    {
      name: 'mobile:safari',
      use: {
        ...devices['iPhone 13'],
        storageState: STORAGE_STATE.user,
      },
      dependencies: ['setup:auth-user'],
      testIgnore: [/admin\//, /setup\//],
    },

    // ── Unauthenticated / Public ────────────────────────────────────────
    {
      name: 'public:noauth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [/products\.browse/, /search\.public/, /i18n\./],
    },

    // ── Teardown ───────────────────────────────────────────────────────
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },
  ],
});
