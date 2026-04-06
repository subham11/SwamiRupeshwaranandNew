# Swamirupeshwaranand.org — Playwright E2E Sanity Test Suite

End-to-end sanity coverage for all **39 Jira stories across 18 epics**.  
Built with **Playwright** + **TypeScript** + **Page Object Model**.

---

## 📁 Project Structure

```
swamirupeshwaranand-e2e/
├── playwright.config.ts              # 8 browser projects (Chrome/Firefox/Safari/Mobile + setup/teardown)
├── package.json                      # Scripts, deps (npm run test:*)
├── tsconfig.json
├── .env.example                      # Copy to .env and fill credentials
├── .gitignore
├── .github/
│   └── workflows/e2e.yml             # CI: parallel jobs per suite + teardown + report merge
│
├── fixtures/
│   ├── index.ts                      # Shared test data constants (users, products, addresses…)
│   └── test-image.jpg                # Minimal JPEG for upload tests
│
├── helpers/
│   ├── api.helper.ts                 # Token auth, create/delete product, coupon, cart helpers
│   ├── test.fixtures.ts              # Custom Playwright fixtures — inject typed POMs + API helpers
│   └── razorpay.mock.ts              # Stub window.Razorpay for success/failure/subscription/donation
│
├── page-objects/
│   └── index.ts                      # 12 typed POM classes (BasePage → AdminCMSPage)
│
├── tests/
│   ├── setup/
│   │   ├── global.setup.ts           # Seeds 30 products × 6 categories + plans (3× retry)
│   │   ├── auth.admin.setup.ts       # Saves admin storageState
│   │   ├── auth.user.setup.ts        # Saves user storageState
│   │   └── global.teardown.ts        # Deletes all sanity-prefixed data
│   │
│   ├── auth/
│   │   └── authentication.spec.ts    # STORY-036, STORY-037
│   ├── products/
│   │   └── products.browse.spec.ts   # STORY-003
│   ├── cart/
│   │   └── cart.spec.ts              # STORY-004
│   ├── checkout/
│   │   └── checkout.spec.ts          # STORY-005
│   ├── payments/
│   │   └── razorpay.payments.spec.ts # STORY-017 (mocked Razorpay, webhooks, all 3 payment types)
│   ├── wishlist/
│   │   └── wishlist.spec.ts          # STORY-008
│   ├── search/
│   │   └── search.public.spec.ts     # STORY-015, STORY-016
│   ├── subscriptions/
│   │   └── subscriptions.spec.ts     # STORY-019
│   ├── donations/
│   │   └── donations.spec.ts         # STORY-025
│   ├── dashboard/
│   │   └── dashboard.spec.ts         # STORY-026
│   ├── performance/
│   │   └── performance.spec.ts       # STORY-033, STORY-034
│   ├── i18n/
│   │   └── i18n.spec.ts              # STORY-038, STORY-027
│   │
│   └── admin/
│       ├── products/
│       │   └── admin.products.spec.ts    # STORY-001, STORY-002
│       ├── orders/
│       │   └── admin.orders.spec.ts      # STORY-006, STORY-007
│       ├── reviews/
│       │   └── admin.reviews.spec.ts     # STORY-011, STORY-012
│       ├── coupons/
│       │   └── admin.coupons.spec.ts     # STORY-009, STORY-010
│       ├── analytics/
│       │   └── admin.analytics.spec.ts   # STORY-013, STORY-014
│       ├── cms/
│       │   └── admin.cms.spec.ts         # STORY-020
│       ├── content/
│       │   └── content.library.spec.ts   # STORY-021
│       ├── emails/
│       │   └── email.templates.spec.ts   # STORY-022
│       ├── newsletter/
│       │   └── admin.newsletter.spec.ts  # STORY-023
│       ├── tickets/
│       │   └── support.tickets.spec.ts   # STORY-024
│       ├── events/
│       │   └── admin.events.spec.ts      # STORY-029, STORY-035
│       ├── media/
│       │   └── admin.media.spec.ts       # STORY-030, STORY-032
│       └── settings/
│           └── admin.settings.spec.ts    # STORY-018, STORY-031
│
└── reports/                              # HTML + JUnit reports (auto-generated, gitignored)
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
npm run install:browsers
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your local BASE_URL, API_URL, admin/user credentials
```

### 3. Run full sanity suite

```bash
npm test
```

### 4. View HTML report

```bash
npm run report
```

---

## 🎯 Run Specific Suites

| Command | What runs |
|---|---|
| `npm run test:chrome` | All tests on Desktop Chrome (user + admin) |
| `npm run test:admin` | Admin-only specs on Chrome |
| `npm run test:public` | Public/unauthenticated specs |
| `npm run test:mobile` | Mobile Chrome + Safari |
| `npm run test:auth` | Authentication & RBAC tests |
| `npm run test:cart` | Cart + Checkout flow |
| `npm run test:search` | Global search (API + UI) |
| `npm run test:i18n` | Bilingual + multi-currency |
| `npm run test:api` | Backend stats API assertions |
| `npm run test:payments` | Razorpay payment flows (mocked) |
| `npm run test:performance` | Image optimisation + skeleton loading |
| `npm run test:headed` | Run with browser visible |
| `npm run test:ui` | Playwright interactive UI mode |
| `npm run test:debug` | Debug mode (step-through) |

---

## 🏗️ Architecture

### Browser Projects

| Project | Auth | Runs |
|---|---|---|
| `setup:seed` | — | Seeds DB before all tests |
| `setup:auth-admin` | Admin login | Saves admin storageState |
| `setup:auth-user` | User login | Saves user storageState |
| `chromium:user` | User | All non-admin specs |
| `chromium:admin` | Admin | All admin/* specs |
| `firefox:user` | User | All non-admin specs |
| `webkit:user` | User | All non-admin specs |
| `mobile:chrome` | User | Non-admin on Pixel 5 |
| `mobile:safari` | User | Non-admin on iPhone 13 |
| `public:noauth` | None | Public browsing + search + i18n |
| `teardown` | Admin | Cleans seeded data |

### Page Object Models

All interactions go through typed POM classes — never raw `page.locator()` in specs:

```
BasePage → ProductsPage, ProductDetailPage, CartPage,
           CheckoutPage, DashboardPage, SearchModal
AdminBasePage → AdminProductsPage, AdminOrdersPage, AdminCMSPage
```

### Data Strategy

- `data-testid` attributes on all interactive elements
- Test data prefixed with `sanity-`, `test-`, `SANITY` for safe teardown
- Seed creates 30 products across 6 real categories via API (with 3× retry + exponential backoff)
- Auth state saved as JSON to `.auth/` — sessions reused across all tests

---

## 📋 Story Coverage — All 39 Stories

| Story | Description | Spec File | Tests |
|---|---|---|---|
| STORY-001 | Product Management (Admin) | admin/products/admin.products.spec.ts | 10 |
| STORY-002 | Product Categories (Admin) | admin/products/admin.products.spec.ts | 4 |
| STORY-003 | Public Product Browsing | products/products.browse.spec.ts | 8 |
| STORY-004 | Shopping Cart | cart/cart.spec.ts | 8 |
| STORY-005 | Checkout & Order Creation | checkout/checkout.spec.ts | 6 |
| STORY-006 | Orders Admin | admin/orders/admin.orders.spec.ts | 8 |
| STORY-007 | Invoice PDF Generation | admin/orders/admin.orders.spec.ts | 3 |
| STORY-008 | Product Wishlist | wishlist/wishlist.spec.ts | 7 |
| STORY-009 | Coupon Management (Admin) | admin/coupons/admin.coupons.spec.ts | 7 |
| STORY-010 | Coupon Redemption (Customer) | admin/coupons/admin.coupons.spec.ts | 5 |
| STORY-011 | Product Reviews (Customer) | admin/reviews/admin.reviews.spec.ts | 5 |
| STORY-012 | Reviews Moderation (Admin) | admin/reviews/admin.reviews.spec.ts | 7 |
| STORY-013 | Analytics Dashboard | admin/analytics/admin.analytics.spec.ts | 9 |
| STORY-014 | Backend Stats Endpoints | admin/analytics/admin.analytics.spec.ts | 5 |
| STORY-015 | Global Search API | search/search.public.spec.ts | 4 |
| STORY-016 | Search UI (Cmd+K) | search/search.public.spec.ts | 10 |
| **STORY-017** | **Razorpay Payment Integration** | **payments/razorpay.payments.spec.ts** | **11** |
| STORY-018 | Razorpay Key Management (Admin) | admin/settings/admin.settings.spec.ts | 6 |
| STORY-019 | Subscription Plans | subscriptions/subscriptions.spec.ts | 5 |
| STORY-020 | CMS Page Builder | admin/cms/admin.cms.spec.ts | 11 |
| **STORY-021** | **Content Library & Monthly Schedule** | **admin/content/content.library.spec.ts** | **11** |
| **STORY-022** | **Styled Email Templates** | **admin/emails/email.templates.spec.ts** | **10** |
| STORY-023 | Newsletter Management | admin/newsletter/admin.newsletter.spec.ts | 6 |
| STORY-024 | Support Tickets | admin/tickets/support.tickets.spec.ts | 7 |
| STORY-025 | Donation System | donations/donations.spec.ts | 6 |
| STORY-026 | Enhanced User Dashboard | dashboard/dashboard.spec.ts | 7 |
| STORY-027 | Multi-Currency (INR/USD) | i18n/i18n.spec.ts | 6 |
| STORY-028 | Global Search UI *(alias of 016)* | search/search.public.spec.ts | — |
| STORY-029 | Activity Log (Audit Trail) | admin/events/admin.events.spec.ts | 5 |
| STORY-030 | Admin Help Center | admin/media/admin.media.spec.ts | 6 |
| STORY-031 | SMTP Email Settings | admin/settings/admin.settings.spec.ts | 4 |
| STORY-032 | Media Library | admin/media/admin.media.spec.ts | 6 |
| **STORY-033** | **Image Optimization & Lazy Loading** | **performance/performance.spec.ts** | **6** |
| **STORY-034** | **Skeleton Loading Components** | **performance/performance.spec.ts** | **6** |
| STORY-035 | Events CRUD | admin/events/admin.events.spec.ts | 6 |
| STORY-036 | OTP + Password Authentication | auth/authentication.spec.ts | 7 |
| STORY-037 | Role-Based Access Control | auth/authentication.spec.ts | 5 |
| STORY-038 | Bilingual Support (EN/HI) | i18n/i18n.spec.ts | 8 |
| STORY-039 | Playwright E2E Test Suite | *this suite itself* | — |
| **Total** | **All 39 stories covered** | **21 spec files** | **~215 tests** |

---

## 🔧 Prerequisites

- **Node.js** 18+
- **Running app stack** (Next.js frontend + NestJS API)
- Admin and test user accounts must exist in the database
- Razorpay test keys configured in app settings
- SMTP not required for sanity (email sends are fire-and-forget)

---

## 🌐 CI/CD Integration

```yaml
# GitHub Actions example
- name: Install Playwright
  run: npm ci && npx playwright install --with-deps

- name: Run Sanity Suite
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    API_URL:  ${{ secrets.API_URL }}
    ADMIN_EMAIL:    ${{ secrets.ADMIN_EMAIL }}
    ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
    USER_EMAIL:     ${{ secrets.USER_EMAIL }}
    USER_PASSWORD:  ${{ secrets.USER_PASSWORD }}
    CI: true
  run: npm test

- name: Upload Report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: reports/
```
