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
3. **Packages are the only public price.** Dish-level prices (`menu_items.base_price_pp`, nullable) never render anywhere on the consumer site. There is no standalone "Menu" section on a vendor profile any more — the package selector (dish name, veg/non-veg dot, optional image, never a price) is the only place menu items show. Discovery cards and vendor profiles show package prices exclusively ("Packages from ₹X/plate at your Y plates").
4. Browsing is anonymous. Phone number is required only to submit an enquiry, tasting request, or match request, via the CTA modals / Match Me form.
5. Max 10 enquiries per phone per day — enforced server-side in the enquiry action (the anon key structurally can't read `enquiries` to self-enforce this, so the count check runs via the service-role client inside the server action).
6. Only vendors with `status = 'live'` ever appear to consumers (RLS enforces this; don't bypass with the service key in consumer paths).
7. Every rating shown anywhere must be labeled "Google rating" explicitly.
8. `/discover` must never show an empty screen: vendors outside the budget band still show, labeled "above"/"below your budget"; cuisine preference is a soft ranking signal, not a hard filter.
9. Go-live gate: a vendor needs only one active package to go live. Nothing else is required.
10. `is_demo` vendors must never be identifiable on the public site — the consumer queries don't select the column at all, so don't add it to them.
11. **"Check availability" is the only consumer CTA name** for the enquiry flow, everywhere (buttons, modal titles, confirmation copy). Never "Enquire for booking" or other phrasing. It is always enabled — menu customisation is optional and must never gate or disable it.
12. **Menu customisation never blocks booking.** A package's category-slot picker (when present) renders under "Choose menu items to get the exact quote," **expanded by default** — there is no collapse toggle. Defaults are preselected; the user can swap freely. An enquiry's stored `selection` is itemised whenever the package has slots (defaults if the user never touched anything, their own picks if they did) — there's no "did they open it" state to gate on any more. Never disable or hide "Check availability" based on selection state. Within a slot, picking a new item never requires manually removing an old one first: a pick-1 slot swaps like a radio button, and a pick-N slot at capacity drops the oldest pick (FIFO) to make room.
13. **`is_verified` is a manual, admin-only signal** ("personally vetted by the Rajani team") — never derived, self-reported, or automatically set. Toggle it explicitly in the vendor editor; it has no relationship to go-live status or `events_completed`.
14. **Match requests**: the "Too busy to browse?" flow inserts into `match_requests` (phone required, everything else optional) via an anon insert-only RLS policy — there is no select policy, so the anon/publishable key can never read this table back, only the service-role client in admin pages can.

## Design system

- Apple-inspired, restrained: system font stack (`-apple-system, "SF Pro Display", Inter, sans-serif`, set as `--font-sans` in `globals.css`) — no serif anywhere, no `font-serif` class. Large headings get `tracking-tight`; hierarchy comes from size/weight/spacing, not color.
- **One accent color for prices and primary CTAs only** — a refined blue, defined as the `royal-*` and `gold-*` CSS custom properties in `globals.css` (both token families share the same values on purpose: a price rendered with `gold-600` and a primary button with `royal-700` must always be visually identical). Never introduce a second decorative accent. Everything else — tag pills, "Default"/"Demo" badges, card hover borders — is neutral gray (`neutral-*` or `ink-muted`/`border`). Exception: genuinely semantic color stays semantic and isn't "the accent" — green for verified/live/veg, red for delete/errors/unpriced, and the admin pipeline's own small status palette (distinguishing `contacted`/`onboarding`/`priced`/`live` needs more than one hue or the badges stop doing their job).
- Soft, neutral shadows (`shadow-card`, `shadow-card-hover`, `shadow-elevated` in `globals.css` — no color tint), large-radius cards (`rounded-2xl`/`rounded-3xl`), hairline borders (`border-border`). Sticky bars and modal overlays get `backdrop-blur`.
- Transitions are `duration-200 ease-out` by default. The menu selector's item-swap transition is a deliberate exception at `duration-150` (see rule 12) — don't "fix" it to match.
- A vendor with no photo never shows an empty grey box: `VendorAvatar` and `LogoUploadForm`'s empty state both render a soft gradient circle with initials instead.

## Out of scope until told otherwise

Canonical/standardised cross-vendor dish database, menu-first search, payments, vendor validation scores, orders-completed counts, media-freshness enforcement, serviceability filters as a user-facing constraint, OTP verification on phone capture, vendor-side accept/decline logistics beyond status fields.

## Conventions

- Keep components server-rendered where possible; client components only for interactive UI (selection state, modals, file uploads, multi-select with add-new).
- Money: numeric per-plate values in INR; format with ₹ and Indian digit grouping (`formatInr` in `lib/pricing.ts`).
- Server actions bound with `.bind(null, ...)` must end in `(formData: FormData)` for use as a form's `action` prop, or `(prevState, formData)` for `useActionState`. A plain arrow function can't cross the server/client boundary as a prop — only a bound "use server" reference can; reorder a server action's params if you need to bind a later one first.
- An `onChange` handler can't be attached to a `<select>` rendered from a Server Component — extract a small client component (see `StatusSelect.tsx`) if auto-submit-on-change is needed.
- Destructive admin actions (delete vendor, bulk-delete demo vendors) get a native `confirm()` dialog via `ConfirmSubmitButton`, since a server action can't intercept a form submit for confirmation itself.
- Long repeated admin lists (menu categories, packages) are native `<details>`/`<summary>` accordions, collapsed by default, showing just enough in the summary to identify the row (name + count / name + price + status badges). Keep any destructive or status-changing `<button>` out of the `<summary>` itself — a button nested there still triggers the native open/close toggle on click; put those inside the expanded body instead.
- Commit after each working change with a short message. Never commit `.env*` files (only `.env*.example`).
