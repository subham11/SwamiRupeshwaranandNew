# Swami Rupeshwaranand Ji Website Revamp – Next.js Boilerplate (CMS-ready)

Includes:
- Next.js App Router (streaming SSR)
- Redux Toolkit + React-Redux
- TanStack Query v5
- i18next + react-i18next (EN + HI)
- Swiper hero slider
- Motion micro-animations
- Tailwind CSS
- CMS-ready content model + provider interface (local JSON default)
- Mega menu (desktop) + mobile menu
- SEO: Metadata + OpenGraph + Twitter + JSON-LD schema

## Setup

```bash
pnpm i
pnpm dev
```

## Locale routes

- `/en`
- `/hi`

`/` redirects to best locale based on browser language via middleware.

## CMS-ready model

- Models: `src/cms/types.ts`
- Provider interface: `src/cms/provider.ts`
- Default provider: `src/cms/localJsonProvider.ts`
- Content bundle: `src/content/bundle.json`

Swap `cms` provider in `src/cms/index.ts` when you integrate a real CMS.

## Mega menu

- Desktop mega menu: `src/components/layout/MegaMenu.tsx`
- Labels/descriptions come from locale dictionaries in `src/locales/*/common.json`

## SEO

- Metadata builder: `src/lib/seo.ts`
- JSON-LD schema: `src/app/[locale]/(home)/_components/SeoSchema.tsx`

Set `NEXT_PUBLIC_SITE_URL` in `.env.local` for correct canonical + OG URLs:

```bash
NEXT_PUBLIC_SITE_URL=https://example.com
```

## Homepage layout

`src/app/[locale]/(home)/_components/HomeSections.tsx` has:
- Image-heavy intro grid
- Services grid (CMS bundle)
- Events cards (CMS bundle)
- Gallery masonry (CMS bundle)
- Donation CTA
