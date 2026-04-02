# Jira Stories - Swami Rupeshwaranand Platform (bhairavapath.com)

---

## Epic: E-Commerce & Products

### STORY-001: Product Management (Admin)
**Type:** Story | **Priority:** High | **Points:** 13

**As an** admin, **I want to** manage products with categories, images, pricing, and bilingual content, **so that** customers can browse and purchase offerings.

**Acceptance Criteria:**
- [ ] Admin can create a product with title, description, price, original price, slug, stock status, tags
- [ ] Admin can upload multiple product images (up to 10) via drag-and-drop
- [ ] Admin can assign a product to a category
- [ ] Admin can set stock status: in_stock, out_of_stock, limited
- [ ] Admin can mark products as featured
- [ ] Admin can toggle product active/inactive
- [ ] All text fields support bilingual content (English + Hindi)
- [ ] Admin can edit and delete existing products
- [ ] Product list supports pagination and search
- [ ] Discount percentage auto-calculates from price vs originalPrice

---

### STORY-002: Product Categories Management
**Type:** Story | **Priority:** High | **Points:** 5

**As an** admin, **I want to** create and manage product categories, **so that** products are organized for easy browsing.

**Acceptance Criteria:**
- [ ] Admin can create categories with name, nameHi, description, descriptionHi, slug
- [ ] Admin can edit and delete categories
- [ ] Categories display on the public products page as filter tabs
- [ ] Each category has a dedicated public page (courses, retreats, astrology, classes, satsang)
- [ ] Deleting a category does not delete associated products

---

### STORY-003: Public Product Browsing
**Type:** Story | **Priority:** High | **Points:** 8

**As a** visitor, **I want to** browse products by category with filtering, **so that** I can find offerings I'm interested in.

**Acceptance Criteria:**
- [ ] Products page displays product cards in a responsive grid
- [ ] Each card shows: image, title, price, original price (strikethrough), category badge
- [ ] Category tabs filter products dynamically
- [ ] Clicking a product card navigates to the product detail page
- [ ] Product detail page shows: title, images, price, description, stock status, add to cart button
- [ ] Hindi locale renders Hindi titles and descriptions
- [ ] Products support infinite scroll / load more

---

### STORY-004: Shopping Cart
**Type:** Story | **Priority:** High | **Points:** 8

**As a** logged-in user, **I want to** add products to my cart, adjust quantities, and proceed to checkout, **so that** I can purchase products.

**Acceptance Criteria:**
- [ ] User can add products to cart from product detail page
- [ ] Cart icon in header shows item count badge
- [ ] Cart page displays all items with title, price, quantity, subtotal
- [ ] User can increase/decrease quantity
- [ ] User can remove individual items
- [ ] User can clear entire cart
- [ ] Cart shows total amount
- [ ] "Proceed to Checkout" button leads to address form
- [ ] Cart persists across page refreshes (server-side)

---

### STORY-005: Checkout & Order Creation
**Type:** Story | **Priority:** High | **Points:** 13

**As a** logged-in user, **I want to** enter my shipping address and place an order with Razorpay payment, **so that** I can complete my purchase.

**Acceptance Criteria:**
- [ ] Address form collects: full name, phone, address line 1 & 2, city, state, pincode, country
- [ ] Address form validates required fields and pincode format
- [ ] Saved address is pre-filled on subsequent visits
- [ ] "Place Order" creates a Razorpay order and opens payment modal
- [ ] Successful payment marks order as "paid" and clears cart
- [ ] Failed payment shows error message and allows retry
- [ ] Order confirmation page shows order details
- [ ] Order confirmation email is sent automatically
- [ ] Invoice PDF is auto-generated and uploaded to S3

---

### STORY-006: Orders Admin
**Type:** Story | **Priority:** High | **Points:** 8

**As an** admin, **I want to** view all orders, update statuses, and manage fulfillment, **so that** I can process customer orders.

**Acceptance Criteria:**
- [ ] Admin orders page shows stats cards: Total, Paid, Processing, Shipped
- [ ] Filter tabs: All, Payment Pending, Paid, Processing, Shipped, Delivered, Cancelled
- [ ] Orders table shows: Order ID, customer, items count, amount, status badge, payment status, date
- [ ] Clicking an order expands to show: item details, shipping address, payment info
- [ ] Admin can update order status via modal with dropdown
- [ ] Tracking number field appears for "shipped" and "delivered" statuses
- [ ] Status update sends email notification to customer
- [ ] Email includes tracking number for shipped orders

---

### STORY-007: Invoice PDF Generation
**Type:** Story | **Priority:** Medium | **Points:** 5

**As a** customer, **I want to** download a PDF invoice for my orders, **so that** I have a record for my purchases.

**Acceptance Criteria:**
- [ ] Invoice PDF generated automatically on successful payment
- [ ] PDF includes: branded header, invoice number, date, order ID
- [ ] PDF shows: bill-to address, itemized table with quantities and prices, total
- [ ] PDF shows: payment reference ID, payment method, status
- [ ] Customer can download invoice from dashboard Orders tab
- [ ] Admin can download invoice for any order
- [ ] Invoice uploaded to S3 at `invoices/<orderId>.pdf`
- [ ] PDF renders correctly on all PDF viewers

---

## Epic: Wishlist & Favorites

### STORY-008: Product Wishlist
**Type:** Story | **Priority:** Medium | **Points:** 5

**As a** logged-in user, **I want to** save products to my wishlist, **so that** I can find them later and decide to purchase.

**Acceptance Criteria:**
- [ ] User can add a product to wishlist from product detail page
- [ ] Adding is idempotent (no duplicate entries)
- [ ] User can view all wishlist items in Dashboard > Wishlist tab
- [ ] Wishlist displays product cards with: image, title, price, "Add to Cart" button
- [ ] User can remove items from wishlist
- [ ] User can clear entire wishlist
- [ ] Wishlist check endpoint returns whether a product is already wishlisted
- [ ] Removing from wishlist uses optimistic UI update

---

## Epic: Coupons & Discounts

### STORY-009: Coupon Management (Admin)
**Type:** Story | **Priority:** Medium | **Points:** 8

**As an** admin, **I want to** create and manage discount coupons, **so that** I can run promotions.

**Acceptance Criteria:**
- [ ] Admin can create coupon with: code (uppercase, unique), type (percentage/flat), value, min order amount
- [ ] Admin can set: max discount cap, expiry date, usage limit, applicable categories
- [ ] Admin can edit and delete coupons
- [ ] Admin can view all coupons in a list with status (active/expired/depleted)
- [ ] Admin can view coupon stats: total uses, total discount given, unique users
- [ ] Coupon codes are case-insensitive on validation
- [ ] System prevents duplicate coupon codes

---

### STORY-010: Coupon Redemption (Customer)
**Type:** Story | **Priority:** Medium | **Points:** 5

**As a** customer, **I want to** apply a coupon code at checkout, **so that** I get a discount on my order.

**Acceptance Criteria:**
- [ ] Validate endpoint checks: coupon exists, is active, not expired, not over usage limit
- [ ] Validate checks per-user: user hasn't already used this coupon
- [ ] Validate checks min order amount
- [ ] Percentage coupons respect max discount cap
- [ ] Flat coupons apply full value (up to order total)
- [ ] Response returns calculated discount amount
- [ ] Apply endpoint records usage and increments usage count
- [ ] Invalid/expired coupons return clear error messages

---

## Epic: Reviews & Ratings

### STORY-011: Product Reviews (Customer)
**Type:** Story | **Priority:** Medium | **Points:** 5

**As a** customer, **I want to** leave reviews and ratings on products, **so that** I can share my experience.

**Acceptance Criteria:**
- [ ] Logged-in user can submit a review with 1-5 star rating
- [ ] Review text is optional (max 2000 chars)
- [ ] Reviews support bilingual text (English + Hindi)
- [ ] New reviews default to "pending" (not publicly visible)
- [ ] Approved reviews appear on product detail page
- [ ] Product average rating and total reviews auto-recalculate on approval

---

### STORY-012: Reviews Moderation (Admin)
**Type:** Story | **Priority:** Medium | **Points:** 8

**As an** admin, **I want to** moderate product reviews, **so that** only appropriate content appears on the site.

**Acceptance Criteria:**
- [ ] Admin reviews page shows stats: Total, Pending, Approved, Average Rating
- [ ] Filter tabs: All, Pending, Approved, Rejected
- [ ] Reviews list shows: product, reviewer email, star rating, review text (truncated), status badge, date
- [ ] Admin can approve or reject reviews with one click
- [ ] Admin can open detail modal to view full review text (English + Hindi)
- [ ] Admin can edit review text before approving (fix typos, add translations)
- [ ] Admin can delete reviews permanently (with confirmation dialog)
- [ ] Product rating recalculates after any moderation action

---

## Epic: Analytics & Reporting

### STORY-013: Analytics Dashboard
**Type:** Story | **Priority:** Medium | **Points:** 13

**As an** admin, **I want to** view analytics with charts covering revenue, users, and products, **so that** I can make data-driven decisions.

**Acceptance Criteria:**
- [ ] Dashboard has 4 tabs: Overview, Revenue & Orders, Users & Growth, Products & Inventory
- [ ] Overview tab shows 8 KPI cards: revenue, orders, users, products, subscribers, donations, tickets, featured
- [ ] Overview shows: monthly revenue bar chart, order status pie chart
- [ ] Revenue tab shows: revenue line chart (6 months), top products bar chart, order status pie, recent orders table
- [ ] Revenue KPIs: this month, last month, all-time, avg order value with % change
- [ ] Users tab shows: user growth line chart (6 months), users by role pie chart
- [ ] Users tab shows engagement cards: support, donations, newsletter metrics
- [ ] Products tab shows: category distribution pie, top sellers bar, category breakdown table
- [ ] Products tab shows: recently added products table with stock status
- [ ] All charts are interactive with tooltips
- [ ] Refresh button fetches latest data in real-time
- [ ] Dark mode support for all charts

---

### STORY-014: Backend Stats Endpoints
**Type:** Story | **Priority:** Medium | **Points:** 8

**As the** analytics dashboard, **I need** aggregation endpoints for orders, products, and users, **so that** I can display comprehensive statistics.

**Acceptance Criteria:**
- [ ] `GET /orders/admin/stats` returns: totalOrders, totalRevenue, thisMonthRevenue, lastMonthRevenue, averageOrderValue, ordersByStatus, topProducts (top 5), monthlyRevenue (6 months)
- [ ] `GET /products/admin/stats` returns: totalProducts, activeProducts, outOfStockProducts, productsByCategory, averagePrice, featuredCount, recentProducts (last 5)
- [ ] `GET /users/admin/stats` returns: totalUsers, usersByRole, activeUsers, newUsersThisMonth, newUsersLastMonth, monthlyGrowth (6 months)
- [ ] All endpoints require admin authentication
- [ ] Revenue excludes cancelled orders
- [ ] Monthly data covers last 6 calendar months

---

## Epic: Search

### STORY-015: Global Search
**Type:** Story | **Priority:** Medium | **Points:** 8

**As a** visitor, **I want to** search across products, events, and pages, **so that** I can quickly find what I'm looking for.

**Acceptance Criteria:**
- [ ] `GET /search?q=<query>` searches products, events, and CMS pages
- [ ] Search is public (no authentication required)
- [ ] Search supports filtering by type: `types=product,event,page`
- [ ] Search supports limit per type
- [ ] Search supports locale parameter (en/hi) for bilingual results
- [ ] Products filtered by title, description, subtitle (case-insensitive)
- [ ] Events filtered by title, description
- [ ] CMS pages filtered by title, slug (only published pages)
- [ ] Results grouped by type with total count

---

### STORY-016: Search UI (Cmd+K)
**Type:** Story | **Priority:** Medium | **Points:** 8

**As a** visitor, **I want to** use a quick search overlay (Cmd+K), **so that** I can find content without leaving the current page.

**Acceptance Criteria:**
- [ ] Magnifying glass icon in header opens search modal
- [ ] Cmd/Ctrl+K keyboard shortcut opens search modal
- [ ] Search input with 300ms debounce before API call
- [ ] Results grouped by type: Products, Events, Pages
- [ ] Product results show: title, price, category badge
- [ ] Keyboard navigation: Up/Down arrows, Enter to select, Escape to close
- [ ] Clicking a result navigates to the item and closes modal
- [ ] Empty state: "Start typing to search..."
- [ ] No results state: "No results found for '<query>'"
- [ ] Loading spinner while searching
- [ ] Dedicated search results page at `/search?q=...` with full results

---

## Epic: Payments & Subscriptions

### STORY-017: Razorpay Payment Integration
**Type:** Story | **Priority:** High | **Points:** 13

**As a** customer, **I want to** pay via Razorpay (UPI, cards, net banking), **so that** I can complete purchases and subscriptions.

**Acceptance Criteria:**
- [ ] Product checkout creates Razorpay order and opens payment modal
- [ ] Subscription purchase creates Razorpay subscription
- [ ] Donation creates Razorpay order for one-time or recurring
- [ ] Payment signature verified on backend before confirming
- [ ] Success redirects to confirmation page with order details
- [ ] Failure shows error message with retry option
- [ ] Webhook endpoint handles async payment confirmations
- [ ] All payment events logged for reconciliation

---

### STORY-018: Admin Settings - Razorpay Key Management
**Type:** Story | **Priority:** High | **Points:** 8

**As a** super admin, **I want to** update Razorpay API keys without a deployment, **so that** I can manage payment configuration independently.

**Acceptance Criteria:**
- [ ] Settings page at `/admin/settings` with Razorpay tab
- [ ] Input fields for: Key ID, Key Secret, Webhook Secret
- [ ] Existing keys displayed with masking (first 4 + last 4 chars)
- [ ] "Test Connection" button validates keys by calling Razorpay API
- [ ] Test mode indicator: amber for test keys (`rzp_test_*`), green for live
- [ ] Keys stored in DynamoDB with encryption
- [ ] Keys refresh in running services every 5 minutes (no restart needed)
- [ ] Fallback to environment variables when DynamoDB keys not set
- [ ] Only super_admin role can access settings

---

### STORY-019: Subscription Plans
**Type:** Story | **Priority:** High | **Points:** 8

**As an** admin, **I want to** manage subscription plans (Free through Diamond), **so that** users can subscribe for content access.

**Acceptance Criteria:**
- [ ] Admin can create plans with: name, price, interval, features list, content access level
- [ ] Admin can edit and delete plans
- [ ] Public subscribe page shows all plans as cards
- [ ] Each plan card shows: name, price, features checklist, subscribe button
- [ ] Free plan activates immediately without payment
- [ ] Paid plans initiate Razorpay subscription flow
- [ ] Subscription confirmation email sent on activation
- [ ] Admin can view all active subscriptions and manage them

---

## Epic: CMS & Content

### STORY-020: CMS Page Builder
**Type:** Story | **Priority:** High | **Points:** 13

**As an** admin, **I want to** create and manage CMS pages with drag-and-drop components, **so that** I can build custom pages without code.

**Acceptance Criteria:**
- [ ] Admin can create pages with: title, slug, status (draft/published)
- [ ] Admin can add components from templates: hero_section, text_block, image_gallery, feature_grid, cta_section, testimonials, faq, video
- [ ] Each component has configurable fields per its template
- [ ] Components can be reordered via drag-and-drop
- [ ] Components can be edited and deleted
- [ ] Published pages accessible at `/{locale}/{slug}`
- [ ] Global components (header, footer, announcement bar) editable via CMS
- [ ] Page preview available before publishing

---

### STORY-021: Content Library & Monthly Schedule
**Type:** Story | **Priority:** Medium | **Points:** 8

**As an** admin, **I want to** upload spiritual content (stotras, kavach, PDFs) and assign them to monthly schedules per subscription plan, **so that** subscribers receive curated content.

**Acceptance Criteria:**
- [ ] Admin can upload content items with: title, type, file, description
- [ ] Content types: stotra, kavach, pdf, audio, video
- [ ] Admin can assign content to specific months and subscription plans
- [ ] Monthly schedule grid shows content assignments per plan per month
- [ ] Subscribers can access only content for their plan level and current/past months
- [ ] Content viewer supports PDF, image, audio playback

---

## Epic: Communication

### STORY-022: Styled Email Templates
**Type:** Story | **Priority:** Medium | **Points:** 8

**As the** system, **I need** professional, branded HTML email templates, **so that** all automated emails maintain a consistent look.

**Acceptance Criteria:**
- [ ] All emails use consistent design: orange gradient header, branded logo text, gray footer
- [ ] Order Confirmation: itemized table, total, shipping address, payment reference, "View Order" CTA
- [ ] Order Status Update: status-specific icon/color/message, tracking number for shipped
- [ ] Welcome Email: spiritual welcome message, quick-link cards (Products, Teachings, Plans), CTA
- [ ] Subscription Confirmation: plan card with features, billing dates, "Access Content" CTA
- [ ] Donation Thank You: amount, purpose, transaction ID, tax receipt note
- [ ] Newsletter Welcome: what-to-expect list, unsubscribe link
- [ ] OTP/Password Reset: large spaced digits, security warning, expiry notice
- [ ] All templates have plain-text fallback
- [ ] All CSS is inline for email client compatibility
- [ ] Templates render correctly in Gmail, Outlook, Apple Mail

---

### STORY-023: Newsletter Management
**Type:** Story | **Priority:** Medium | **Points:** 5

**As an** admin, **I want to** manage newsletter subscribers and send campaigns, **so that** I can engage users with updates.

**Acceptance Criteria:**
- [ ] Users can subscribe via newsletter form on website
- [ ] Admin can view all subscribers with status (active/unsubscribed)
- [ ] Admin can create email campaigns with subject and HTML content
- [ ] Admin can send campaigns to all active subscribers
- [ ] Admin can delete subscribers
- [ ] Stats: total subscribers, active, unsubscribed, 30-day growth, campaigns sent
- [ ] Newsletter welcome email sent on subscription

---

### STORY-024: Support Tickets
**Type:** Story | **Priority:** Medium | **Points:** 5

**As a** user, **I want to** submit support tickets and receive replies, **so that** I can get help with issues.

**Acceptance Criteria:**
- [ ] User can create ticket with: subject, category, priority, description
- [ ] User can view their tickets and replies
- [ ] Admin can view all tickets with filter by status
- [ ] Admin can reply to tickets
- [ ] Admin can update ticket status: open, in_progress, resolved, closed
- [ ] Stats: total tickets, open, in progress, resolved, avg resolution time

---

## Epic: Donations

### STORY-025: Donation System
**Type:** Story | **Priority:** Medium | **Points:** 8

**As a** visitor, **I want to** make one-time or recurring donations, **so that** I can support the ashram.

**Acceptance Criteria:**
- [ ] Donation page shows configurable donation amounts and purposes
- [ ] Custom amount input supported
- [ ] One-time and recurring frequency options
- [ ] Razorpay payment modal for processing
- [ ] Donation thank-you email sent on success
- [ ] Admin can configure donation amounts and purposes
- [ ] Admin can view all donations with filters
- [ ] Stats: total donations, this month, avg donation, donor count, recurring donors

---

## Epic: User Experience

### STORY-026: Enhanced User Dashboard
**Type:** Story | **Priority:** High | **Points:** 13

**As a** logged-in user, **I want** a comprehensive dashboard with profile, orders, subscriptions, wishlist, and security, **so that** I can manage my account in one place.

**Acceptance Criteria:**
- [ ] 5 tabs: Profile, Orders, Subscriptions, Wishlist, Security
- [ ] Profile tab: edit name, phone, view email, verification badge, member since
- [ ] Orders tab: list of all orders as expandable cards with status badges
- [ ] Orders tab: each order shows items, shipping address, tracking number
- [ ] Orders tab: "Download Invoice" link for paid/delivered orders
- [ ] Orders tab: empty state with CTA to browse products
- [ ] Subscriptions tab: current plan card with name, status, price, dates, features
- [ ] Subscriptions tab: payment history list
- [ ] Subscriptions tab: "Renew" button for expired, "Manage" for active
- [ ] Wishlist tab: product cards grid with "Add to Cart" and "Remove"
- [ ] Security tab: change password / set password (for OTP-only users)
- [ ] Responsive: sidebar on desktop, horizontal tabs on mobile
- [ ] Loading skeletons while data loads

---

### STORY-027: Multi-Currency Support (INR/USD)
**Type:** Story | **Priority:** Low | **Points:** 5

**As an** international visitor, **I want to** view prices in USD, **so that** I can understand pricing in my currency.

**Acceptance Criteria:**
- [ ] Currency switcher in header (INR/USD with flags)
- [ ] All product prices convert using configured exchange rate
- [ ] Cart totals display in selected currency
- [ ] Currency preference persisted to localStorage
- [ ] Proper locale-aware formatting (INR: no decimals, USD: 2 decimals)
- [ ] Payments still processed in INR (display-only conversion)

---

### STORY-028: Global Search UI
**Type:** Story | **Priority:** Medium | **Points:** 5

*See STORY-016 for full details. This covers the frontend implementation.*

---

## Epic: Admin Tools

### STORY-029: Activity Log (Audit Trail)
**Type:** Story | **Priority:** Medium | **Points:** 8

**As an** admin, **I want to** see an audit trail of all admin actions, **so that** I can track who changed what and when.

**Acceptance Criteria:**
- [ ] ActivityLogService is @Global and injectable by any service
- [ ] `log()` method is fire-and-forget (never throws, never blocks)
- [ ] Logs capture: userId, userEmail, action, entityType, entityId, details, metadata
- [ ] Entity types: product, order, user, cms, coupon, setting, event, subscription, newsletter, donation, support
- [ ] `GET /activity-log` returns paginated logs sorted by date (newest first)
- [ ] Supports filtering by entityType and userId via query params
- [ ] `GET /activity-log/stats` returns: total logs, breakdown by entity type, breakdown by action, active users today
- [ ] All endpoints require admin authentication

---

### STORY-030: Admin Help Center
**Type:** Story | **Priority:** Medium | **Points:** 8

**As an** admin, **I want** comprehensive documentation for all admin features, **so that** I can use the platform without developer assistance.

**Acceptance Criteria:**
- [ ] Help page at `/admin/help` with sidebar navigation
- [ ] Search functionality within documentation
- [ ] Scroll tracking highlights active section in sidebar
- [ ] 11 documentation sections: Getting Started, Products, CMS, Payments, Orders, Subscriptions, Media, Reviews, Analytics, Other Modules, Settings
- [ ] Each section has: overview, step-by-step guides, field reference tables, info/warning boxes
- [ ] Reusable doc components: InfoBox, StepList, FieldTable, CodeBlock
- [ ] Mobile responsive with collapsible sidebar
- [ ] Placeholder for screenshots (to be added manually)

---

### STORY-031: SMTP Email Settings
**Type:** Story | **Priority:** Low | **Points:** 3

**As a** super admin, **I want to** configure SMTP email settings via the admin panel, **so that** I can change email delivery without a deployment.

**Acceptance Criteria:**
- [ ] SMTP tab in admin settings page
- [ ] Fields: Host, Port, Username, Password (masked), From Email, From Name
- [ ] Save button persists to DynamoDB
- [ ] Settings used by EmailService at runtime
- [ ] Fallback to environment variables when not configured

---

## Epic: Media & Files

### STORY-032: Media Library
**Type:** Story | **Priority:** Medium | **Points:** 5

**As an** admin, **I want to** upload and manage files (images, PDFs, videos), **so that** I can use them across the platform.

**Acceptance Criteria:**
- [ ] Upload interface with drag-and-drop support
- [ ] File browser with folder organization
- [ ] Supported formats: JPEG, PNG, WebP, GIF, PDF, MP4, MP3, WAV
- [ ] Size limits: images 5MB, video 50MB, audio 20MB
- [ ] Copy file URL for use in CMS/products
- [ ] Delete files with confirmation
- [ ] Presigned URL generation for secure uploads to S3

---

## Epic: Performance & Optimization

### STORY-033: Image Optimization & Lazy Loading
**Type:** Story | **Priority:** Low | **Points:** 5

**As a** visitor, **I want** fast-loading images, **so that** pages load quickly even on slow connections.

**Acceptance Criteria:**
- [ ] LazyImage component using next/image with IntersectionObserver
- [ ] Shimmer blur placeholder while image loads
- [ ] Error fallback for broken images
- [ ] Aspect ratio support (1:1, 16:9, 4:3, 3:2)
- [ ] AVIF and WebP format support configured in Next.js
- [ ] 24-hour image cache TTL
- [ ] Remote patterns for S3 and CloudFront domains

---

### STORY-034: Skeleton Loading Components
**Type:** Story | **Priority:** Low | **Points:** 2

**As a** visitor, **I want to** see loading placeholders instead of blank screens, **so that** I know content is loading.

**Acceptance Criteria:**
- [ ] Generic Skeleton component with pulse animation
- [ ] ProductCardSkeleton matching product card layout
- [ ] TextSkeleton with configurable number of lines
- [ ] Shimmer gradient animation via Tailwind config
- [ ] Used in dashboard tabs while data loads

---

## Epic: Events Management

### STORY-035: Events CRUD
**Type:** Story | **Priority:** Medium | **Points:** 5

**As an** admin, **I want to** manage events with dates, locations, and bilingual content, **so that** visitors can discover upcoming programs.

**Acceptance Criteria:**
- [ ] Admin can create events with: title, description, date range, location, image
- [ ] Events support bilingual content (English + Hindi)
- [ ] Admin can edit and delete events
- [ ] Public events page lists upcoming events
- [ ] Event detail page shows full information
- [ ] Events appear in search results

---

## Epic: Authentication & Security

### STORY-036: OTP + Password Authentication
**Type:** Story | **Priority:** High | **Points:** 8

**As a** user, **I want to** log in via OTP or password, **so that** I can access my account securely.

**Acceptance Criteria:**
- [ ] Login page supports email + OTP flow
- [ ] Login page supports email + password flow
- [ ] OTP sent via email with 6-digit code
- [ ] OTP expires after 5 minutes
- [ ] Users can set a password after OTP login
- [ ] Users can change password from dashboard Security tab
- [ ] Forgot password flow via OTP
- [ ] JWT access token + refresh token issued on login
- [ ] Token auto-refresh on expiry

---

### STORY-037: Role-Based Access Control
**Type:** Story | **Priority:** High | **Points:** 5

**As the** system, **I need** role-based access control, **so that** different users have appropriate permissions.

**Acceptance Criteria:**
- [ ] Roles: super_admin, admin, content_editor, user
- [ ] Super Admin: full access to all features including Settings
- [ ] Admin: access to all admin pages except Settings
- [ ] Content Editor: access to CMS, Events, Products, Content Library, Media
- [ ] User: access to dashboard, cart, orders, subscriptions only
- [ ] Unauthenticated: access to public pages only
- [ ] Admin pages redirect non-admin users to `/dashboard`
- [ ] API endpoints enforce role checks via guards

---

## Epic: Internationalization

### STORY-038: Bilingual Support (English/Hindi)
**Type:** Story | **Priority:** Medium | **Points:** 5

**As a** visitor, **I want to** switch between English and Hindi, **so that** I can read content in my preferred language.

**Acceptance Criteria:**
- [ ] Floating language switcher on all pages
- [ ] URL structure: `/en/...` and `/hi/...`
- [ ] All product, event, and CMS content supports bilingual fields
- [ ] Navigation and static text translated
- [ ] Language preference persisted
- [ ] Search results respect locale parameter

---

## Epic: E2E Testing

### STORY-039: Playwright E2E Test Suite
**Type:** Story | **Priority:** Medium | **Points:** 13

**As a** developer, **I want** comprehensive E2E tests, **so that** I can catch regressions before deployment.

**Acceptance Criteria:**
- [ ] Test infrastructure: Playwright config with 8 projects (Chrome, Firefox, Safari, Mobile, no-auth)
- [ ] Auth setup: automated admin login with storageState
- [ ] Product seeding: 30 test products across 6 categories via API
- [ ] Seed retry: 3 attempts with exponential backoff for resilience
- [ ] Product tests: browsing, categories, detail page
- [ ] Cart tests: add/remove items, checkout flow
- [ ] Payment tests: Razorpay mock for subscriptions and orders
- [ ] CMS tests: full lifecycle (create page, add components, verify, delete)
- [ ] Cleanup: teardown project deletes test data
- [ ] 30+ test specs across 10 test directories
- [ ] HTML report generation

---

## Summary

| Epic | Stories | Total Points |
|------|---------|-------------|
| E-Commerce & Products | 7 | 60 |
| Wishlist & Favorites | 1 | 5 |
| Coupons & Discounts | 2 | 13 |
| Reviews & Ratings | 2 | 13 |
| Analytics & Reporting | 2 | 21 |
| Search | 2 | 13 |
| Payments & Subscriptions | 3 | 29 |
| CMS & Content | 2 | 21 |
| Communication | 3 | 18 |
| Donations | 1 | 8 |
| User Experience | 3 | 23 |
| Admin Tools | 3 | 19 |
| Media & Files | 1 | 5 |
| Performance | 2 | 7 |
| Events | 1 | 5 |
| Authentication | 2 | 13 |
| Internationalization | 1 | 5 |
| E2E Testing | 1 | 13 |
| **Total** | **39 stories** | **291 points** |
