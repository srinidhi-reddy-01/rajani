# Claude Code instructions — Rajani

@AGENTS.md

Read PLAN.md before any feature work. It is the source of truth for scope and sequencing.

## Stack

- Next.js (App Router) + TypeScript, deployed on Vercel
- Supabase: Postgres + RLS. Consumers use the anon/publishable key (read live vendors, cuisines, event_types; insert enquiries/tastings only). Admin pages and server actions use the service-role key server-side only — never expose it to the browser (guarded with the `server-only` package).
- Schema lives in `supabase/migrations/`. Never change schema by clicking in the Supabase dashboard — always write a new migration file and run `supabase db push`.
- Admin auth: password from `ADMIN_PASSWORD` env var, HMAC session cookie, no session store. Every admin server action re-checks the session itself (a form action endpoint is directly POST-able regardless of what a layout renders).

## Product rules (do not violate)

1. `packages.base_price_pp` / `menu_items.base_price_pp` are per-plate prices at the 500-plate baseline (the admin panel says so wherever a price is entered). `pricing_tiers` is deprecated — don't read it. Every user-facing price is `basePricePp * getPlateMultiplier(plates)` (`lib/pricing.ts`): multiplier 1 at 500 plates, piecewise linear (not one straight line - there's a kink at 500) from +10% at 100 plates down to −10% at 1000 plates, clamped flat outside that range. Use `quotePerPlate(basePricePp, plates)` everywhere a price renders - never read `base_price_pp` directly for display.
2. Every displayed quote carries the disclaimer: "Actual price may vary by 10–15% based on dish changes and plate-count updates. Please confirm with the caterer for final booking."
3. **Packages are the only public price.** Dish-level prices (`menu_items.base_price_pp`, nullable) never render anywhere on the consumer site — the Menu section on a vendor profile shows dish name, veg/non-veg dot, and an optional image only. Discovery cards and vendor profiles show package prices exclusively ("Packages from ₹X/plate at your Y plates").
4. Browsing is anonymous. Phone number is required only to submit an enquiry, tasting request, or match request, via the CTA modals / Match Me form.
5. Max 10 enquiries per phone per day — enforced server-side in the enquiry action (the anon key structurally can't read `enquiries` to self-enforce this, so the count check runs via the service-role client inside the server action).
6. Only vendors with `status = 'live'` ever appear to consumers (RLS enforces this; don't bypass with the service key in consumer paths).
7. Every rating shown anywhere must be labeled "Google rating" explicitly.
8. `/discover` must never show an empty screen: vendors outside the budget band still show, labeled "above"/"below your budget"; cuisine preference is a soft ranking signal, not a hard filter.
9. Go-live gate: a vendor needs only one active package to go live. Nothing else is required.
10. `is_demo` vendors must never be identifiable on the public site — the consumer queries don't select the column at all, so don't add it to them.
11. **"Check availability" is the only consumer CTA name** for the enquiry flow, everywhere (buttons, modal titles, confirmation copy). Never "Enquire for booking" or other phrasing. It is always enabled — menu customisation is optional and must never gate or disable it.
12. **Menu customisation never blocks booking.** A package's category-slot picker (when present) renders collapsed by default behind "Choose menu items to get the exact quote." An enquiry's stored `selection` is itemised only if the user actually opened it and picked items; otherwise the enquiry carries package-level context only. Never require opening the disclosure to enable the CTA.
13. **`is_verified` is a manual, admin-only signal** ("personally vetted by the Rajani team") — never derived, self-reported, or automatically set. Toggle it explicitly in the vendor editor; it has no relationship to go-live status or `events_completed`.
14. **Match requests**: the "Too busy to browse?" flow inserts into `match_requests` (phone required, everything else optional) via an anon insert-only RLS policy — there is no select policy, so the anon/publishable key can never read this table back, only the service-role client in admin pages can.

## Out of scope until told otherwise

Canonical/standardised cross-vendor dish database, menu-first search, payments, vendor validation scores, orders-completed counts, media-freshness enforcement, serviceability filters as a user-facing constraint, OTP verification on phone capture, vendor-side accept/decline logistics beyond status fields.

## Conventions

- Keep components server-rendered where possible; client components only for interactive UI (selection state, modals, file uploads, multi-select with add-new).
- Money: numeric per-plate values in INR; format with ₹ and Indian digit grouping (`formatInr` in `lib/pricing.ts`).
- Server actions bound with `.bind(null, ...)` must end in `(formData: FormData)` for use as a form's `action` prop, or `(prevState, formData)` for `useActionState`. A plain arrow function can't cross the server/client boundary as a prop — only a bound "use server" reference can; reorder a server action's params if you need to bind a later one first.
- An `onChange` handler can't be attached to a `<select>` rendered from a Server Component — extract a small client component (see `StatusSelect.tsx`) if auto-submit-on-change is needed.
- Destructive admin actions (delete vendor, bulk-delete demo vendors) get a native `confirm()` dialog via `ConfirmSubmitButton`, since a server action can't intercept a form submit for confirmation itself.
- Commit after each working change with a short message. Never commit `.env*` files (only `.env*.example`).
