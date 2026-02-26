# Product Module Implementation Plan

> Temporary planning file — delete after implementation is complete.

---

## Overview

Build a product/e-commerce catalog module inspired by Anveshan.farm, with bilingual (English + Hindi) support throughout. Includes home page carousel, product listing with infinite scroll, product detail with image gallery, admin product management, and product reviews with ratings.

---

## Phase 1: Backend Foundation

### 1. ✅ Design Product DB Schema (DynamoDB Single-Table)

**PRODUCT entity:**
| Field | Type | Notes |
|---|---|---|
| PK | `PRODUCT#<id>` | UUID |
| SK | `PRODUCT#<id>` | Same as PK |
| GSI1PK | `PRODUCT` | For listing all products |
| GSI1SK | `PRODUCT#<createdAt>` | Sort by date |
| GSI2PK | `CATEGORY#<categoryId>` | For listing by category |
| GSI2SK | `PRODUCT#<displayOrder>` | Sort within category |
| id | string | UUID |
| title | string | English title |
| titleHi | string | Hindi title |
| subtitle | string | English subtitle (short tagline) |
| subtitleHi | string | Hindi subtitle |
| description | string | English full description |
| descriptionHi | string | Hindi full description |
| slug | string | URL-friendly slug (unique) |
| categoryId | string | Reference to category |
| categoryName | string | Denormalized category name |
| categoryNameHi | string | Denormalized category name Hindi |
| price | number | Selling price in ₹ |
| originalPrice | number | MRP / strikethrough price |
| discountPercent | number | Computed or stored discount % |
| images | string[] | Array of S3 keys (max 5) |
| imageUrls | string[] | Presigned/CDN URLs (computed) |
| videoKey | string | S3 key for product video |
| videoUrl | string | Presigned/CDN URL (computed) |
| isFeatured | boolean | Show in home carousel |
| isActive | boolean | Published or draft |
| displayOrder | number | Sort order |
| avgRating | number | Denormalized average rating |
| totalReviews | number | Denormalized review count |
| tags | string[] | Search/filter tags |
| weight | string | e.g., "500g", "1L" |
| weightHi | string | Hindi weight label |
| stockStatus | enum | `in_stock`, `out_of_stock`, `limited` |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

**PRODUCT_CATEGORY entity:**
| Field | Type | Notes |
|---|---|---|
| PK | `PRODUCT_CATEGORY#<id>` | UUID |
| SK | `PRODUCT_CATEGORY#<id>` | Same as PK |
| GSI1PK | `PRODUCT_CATEGORY` | For listing all |
| GSI1SK | `PRODUCT_CATEGORY#<displayOrder>` | Sort order |
| id | string | UUID |
| name | string | English name |
| nameHi | string | Hindi name |
| description | string | English description |
| descriptionHi | string | Hindi description |
| slug | string | URL-friendly slug |
| imageKey | string | Category thumbnail S3 key |
| imageUrl | string | Presigned/CDN URL |
| isActive | boolean | Active/inactive |
| displayOrder | number | Sort order |
| productCount | number | Denormalized count |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

**PRODUCT_REVIEW entity:**
| Field | Type | Notes |
|---|---|---|
| PK | `PRODUCT#<productId>` | Parent product |
| SK | `REVIEW#<reviewId>` | UUID |
| GSI1PK | `REVIEW` | For admin listing all reviews |
| GSI1SK | `REVIEW#<createdAt>` | Sort by date |
| id | string | UUID |
| productId | string | Parent product ID |
| userId | string | Reviewer's user ID |
| userName | string | Denormalized display name |
| rating | number | 1-5 stars |
| reviewText | string | English review text |
| reviewTextHi | string | Hindi review text (optional) |
| isApproved | boolean | Admin moderation |
| isVerifiedPurchase | boolean | If user bought the product |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

### 2. ✅ Create Product DTOs & Enums

- `StockStatus` enum: `in_stock`, `out_of_stock`, `limited`
- `CreateProductDto` — all required/optional fields with class-validator decorators
- `UpdateProductDto` — extends `PartialType(CreateProductDto)`
- `CreateProductCategoryDto` / `UpdateProductCategoryDto`
- `CreateProductReviewDto` / `UpdateProductReviewDto`
- `ProductResponseDto`, `ProductCategoryResponseDto`, `ProductReviewResponseDto`
- `ProductListQueryDto` — pagination (cursor-based), category filter, search, featured filter
- Bilingual fields: `title/titleHi`, `subtitle/subtitleHi`, `description/descriptionHi`, `name/nameHi`, `weight/weightHi`

### 3. ✅ Build Product CRUD Service

- `products.service.ts`
- Methods:
  - `createProduct(dto)` — generate UUID, slug from title, store in DynamoDB
  - `updateProduct(id, dto)` — partial update
  - `deleteProduct(id)` — soft delete or hard delete
  - `getProductById(id)` — single product fetch
  - `getProductBySlug(slug)` — for public page (needs a GSI or scan)
  - `listProducts(query)` — paginated, filterable by category, featured, search
  - `listFeaturedProducts()` — for home carousel (GSI1 with isFeatured filter)
  - `createCategory(dto)` / `updateCategory(id, dto)` / `deleteCategory(id)`
  - `listCategories()` — all active categories
  - `updateProductRatingSummary(productId)` — recalculate avg rating & count after review changes
- Use `DatabaseService` via `@Inject(DATABASE_SERVICE)`
- Map responses with locale support (return `title` or `titleHi` based on locale param)

### 4. ✅ Build Product API Endpoints

- `products.controller.ts`
- **Admin endpoints** (JWT + admin role guard):
  - `POST /products` — create product
  - `PUT /products/:id` — update product
  - `DELETE /products/:id` — delete product
  - `GET /products/admin/list` — admin list (with drafts)
  - `POST /products/categories` — create category
  - `PUT /products/categories/:id` — update category
  - `DELETE /products/categories/:id` — delete category
- **Public endpoints** (no auth):
  - `GET /products/public` — paginated product list (cursor-based, 10 per page)
  - `GET /products/public/featured` — featured products for carousel
  - `GET /products/public/:slug` — product detail by slug
  - `GET /products/public/categories` — all active categories
  - `GET /products/public/category/:categorySlug` — products in a category
- All public endpoints accept `?locale=hi` query param

### 5. ✅ Add Product Image/Video Upload

- Extend existing S3 upload service or create product-specific upload
- Add `product_image` and `product_video` to `FileCategory` enum
- Upload endpoint: `POST /products/:id/upload` (multipart, admin only)
- Support up to 5 images per product
- Support 1 video per product (max 20MB, 10s)
- Generate thumbnails if possible, or use first image as thumbnail
- Return S3 keys; store in product entity

### 6. ✅ Build Product Review Service

- `product-reviews.service.ts`
- Methods:
  - `createReview(userId, productId, dto)` — create review, update product rating summary
  - `updateReview(reviewId, dto)` — admin edit
  - `deleteReview(reviewId)` — admin delete, update product rating summary
  - `listReviewsByProduct(productId, cursor)` — paginated reviews for a product
  - `listAllReviews(cursor)` — admin view all reviews
  - `approveReview(reviewId)` — toggle approval
- Recalculate `avgRating` and `totalReviews` on product entity after each create/delete

### 7. ✅ Build Review API Endpoints

- **Authenticated user endpoints**:
  - `POST /products/:productId/reviews` — submit review (1 per user per product)
  - `GET /products/:productId/reviews` — list approved reviews (public)
- **Admin endpoints**:
  - `GET /products/reviews/admin/list` — all reviews (approved + pending)
  - `PUT /products/reviews/:id/approve` — approve/reject
  - `DELETE /products/reviews/:id` — delete review

---

## Phase 2: Admin Frontend

### 8. ✅ Admin: Product Management Page

- `frontend/src/app/[locale]/admin/products/page.tsx`
- Table listing all products (name, category, price, stock status, rating, active)
- Add/Edit product modal or page with:
  - Bilingual fields (title, titleHi, subtitle, subtitleHi, description, descriptionHi)
  - Price, original price, discount %
  - Category dropdown
  - Multi-image uploader (drag & drop, reorder, max 5)
  - Video uploader (max 20MB)
  - Weight, stock status, featured toggle, active toggle
  - Display order
  - Tags input
- Delete confirmation dialog
- Filters: by category, stock status, active/inactive

### 9. ✅ Admin: Category Management

- `frontend/src/app/[locale]/admin/products/categories/page.tsx` (or inline section)
- CRUD for product categories
- Bilingual name/description fields
- Image upload for category thumbnail
- Display order, active toggle
- Show product count per category

---

## Phase 3: Public Frontend

### 10. ✅ Home: Product Carousel Section

- New section on home page (below existing sections or configurable position)
- Horizontal scrollable carousel of featured products
- Category filter tabs at top (e.g., "All", "Honey", "Ghee", "Oils")
- Each card: image, title (locale-aware), subtitle, price with discount badge, rating stars
- "See All Products →" button linking to `/products`
- Smooth scroll with arrow buttons on desktop
- Responsive: 1 card on mobile, 2 on tablet, 4 on desktop

### 11. ✅ Products: See-All Grid Page

- `frontend/src/app/[locale]/products/page.tsx`
- Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
- Category sidebar/filter bar at top
- Each card: image, title, subtitle, price (with strikethrough original), discount badge, rating
- **Infinite scroll**: load 10 products at a time using IntersectionObserver
- Cursor-based pagination (use `lastEvaluatedKey` from DynamoDB)
- Loading spinner at bottom while fetching
- Empty state for no products
- Click card → navigate to `/products/[slug]`

### 12. ✅ Product Detail Page + Image Gallery

- `frontend/src/app/[locale]/products/[slug]/page.tsx`
- Left side: Image gallery
  - Main large image display
  - Thumbnail strip below (click to swap main image)
  - If video exists, show video thumbnail with play icon
- Right side: Product info
  - Title (locale-aware), subtitle
  - Price with discount (strikethrough original, green discount %)
  - Description (locale-aware)
  - Weight/size info
  - Stock status indicator
  - "Coming Soon" or external purchase link (if applicable)
- Below: Reviews section (see #14)
- Breadcrumb: Home > Products > Category > Product Name

### 13. ✅ Skeleton Loaders & Animations

- Skeleton components for:
  - Product card (grid placeholder)
  - Product detail page
  - Carousel section
  - Review cards
- Animations:
  - Fade-in on card appear (IntersectionObserver)
  - Scale on card hover (transform: scale(1.02))
  - Smooth image transitions in gallery
  - Slide-in for carousel
- Use Tailwind `animate-pulse` for skeletons
- Use `framer-motion` or CSS transitions for micro-animations

### 14. ✅ Product Reviews UI Component

- Reviews section on product detail page
- Display: user name, star rating (filled/empty stars), review text, date
- "Write a Review" button (authenticated users only)
- Review form: star rating selector (clickable stars), text area
- Show average rating summary at top (e.g., "4.5 out of 5 — 23 reviews")
- Rating distribution bar chart (5★: 60%, 4★: 25%, etc.)
- Paginated review list (load more button)
- Locale-aware: show Hindi review text when locale=hi

---

## Phase 4: Finalize

### 15. Test, Build & Deploy

- Test all admin CRUD operations (create, edit, delete products & categories)
- Test public endpoints with pagination and locale switching
- Test image/video upload (S3 permissions, CORS)
- Test review submission and moderation flow
- Build backend: `npm run build`
- Deploy backend: `npx serverless deploy --stage prod --aws-profile SwamiJi`
- Push frontend to main → Amplify auto-deploys
- Verify DynamoDB table has correct GSI access patterns
- Smoke test: home carousel, product grid, detail page, reviews

---

## Key Patterns to Follow

- **Bilingual**: Every user-facing text field has an English + Hindi variant
- **Single-table DynamoDB**: Use PK/SK/GSI1/GSI2 access patterns
- **Cursor-based pagination**: Use `lastEvaluatedKey` for infinite scroll
- **File uploads**: Reuse existing S3 upload infrastructure, add new FileCategory values
- **Admin guards**: `@UseGuards(JwtAuthGuard, AdminGuard)` on admin endpoints
- **Locale support**: `?locale=hi` on public endpoints, map fields accordingly
- **Denormalization**: Store `avgRating`, `totalReviews` on product entity; `categoryName` on product
- **Consistent styling**: Follow existing Tailwind + orange/amber accent theme
