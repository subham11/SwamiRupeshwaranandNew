# E2E Testing with Playwright

This directory contains end-to-end tests for the Swami Rupeshwaranand website using Playwright.

## Structure

```
e2e/
├── playwright.config.ts    # Playwright configuration
├── package.json           # Dependencies
├── fixtures/              # Test fixtures and data
│   ├── test-fixtures.ts   # Page object fixtures
│   ├── test-data.ts       # Test data constants
│   └── .auth/             # Auth state storage (gitignored)
├── page-objects/          # Page Object Models
│   ├── BasePage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   └── ...
└── tests/                 # Test specifications
    ├── auth/
    ├── donation/
    ├── newsletter/
    ├── support/
    ├── subscriptions/
    ├── admin/
    └── pages/
```

## Setup

```bash
cd e2e
npm install
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run against different environments
```bash
# Local
npm run test:local

# Staging/Production
npm run test:staging
```

### Run specific test file
```bash
npx playwright test tests/auth/login.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test -g "should display"
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `BASE_URL` | Target URL for tests |
| `TEST_USER_EMAIL` | Test user email |
| `TEST_USER_PASSWORD` | Test user password |
| `TEST_ADMIN_EMAIL` | Admin user email |
| `TEST_ADMIN_PASSWORD` | Admin user password |

## Writing Tests

### Using Page Objects

```typescript
import { test, expect } from '../../fixtures';

test('example test', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await expect(loginPage.errorMessage).toBeHidden();
});
```

### No-Auth Tests

For tests that don't require authentication, use the `.noauth.spec.ts` suffix:

```typescript
// tests/pages/public.noauth.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/en');
  await expect(page).toHaveTitle(/.+/);
});
```

## CI/CD

E2E tests run automatically:
- On push to `main` (frontend or e2e changes)
- On pull requests
- Can be triggered manually via GitHub Actions

### GitHub Secrets Required

For authenticated tests, add these secrets to your GitHub repository:
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`

## Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

Reports are also uploaded as artifacts in GitHub Actions.

## Debugging

### Trace Viewer

When tests fail, traces are captured. View them with:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshots

Failed tests automatically capture screenshots in `test-results/`.

### Video Recording

First retry of failed tests records video in `test-results/`.

## Best Practices

1. **Use Page Objects** - Keep selectors in page objects, not tests
2. **Use data-testid** - Add `data-testid` attributes to components
3. **Avoid hardcoded waits** - Use Playwright's auto-waiting
4. **Keep tests independent** - Each test should work in isolation
5. **Use fixtures** - Share setup logic via fixtures
