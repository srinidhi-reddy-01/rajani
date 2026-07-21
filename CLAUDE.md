# Claude Code instructions — Project Catering

Read PLAN.md before any feature work. It is the source of truth for scope and sequencing.

## Stack

- Next.js (App Router) + TypeScript, deployed on Vercel
- Supabase: Postgres + RLS. Consumers use the anon key (read live vendors, insert enquiries/tastings only). Admin pages and jobs use the service-role key server-side only — never expose it to the browser.
- Schema lives in `supabase/migrations/`. Never change schema by clicking in the Supabase dashboard — always write a new migration file and run `supabase db push`.

## Product rules (do not violate)

1. Every price shown to users is computed client/server-side from `menu_items.base_price_pp` (500-plate baseline) adjusted by the vendor's `pricing_tiers` band for the user's plate count.
2. Every displayed quote carries the disclaimer: "Actual price may vary by 10–15% based on dish changes and plate-count updates. Please confirm with the caterer for final booking."
3. Dish-level prices are VISIBLE to users. Do not hide them.
4. Browsing is anonymous. Phone number is required only to send an enquiry or tasting request.
5. Max 10 enquiries per phone per day — enforce server-side.
6. Only vendors with `status = 'live'` ever appear to consumers (RLS enforces this; don't bypass with service key in consumer paths).
7. Tasting request UX is just: submit phone → "Our team will contact you." No logistics features.

## Out of scope until told otherwise

Canonical/standardised dish database, cross-vendor menu matching, menu-first search, payments, vendor validation scores, orders-completed counts, media-freshness enforcement, serviceability filters, ranking algorithms (use equal weighting).

## Conventions

- Keep components server-rendered where possible; client components only for interactive pricing UI.
- Money: numeric per-plate values in INR; format with ₹ and Indian digit grouping.
- Commit after each working change with a short message. Never commit `.env*` files.
