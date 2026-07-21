# Rajani — Hyderabad Catering Marketplace

Core promise: **real packages, real prices, no login required.** A guided 5-step flow
captures what the user needs, then matches them to caterers whose packages fit their
budget — never an empty screen. Every quote carries the disclaimer: *"Actual price may
vary by 10–15% based on dish changes and plate-count updates. Please confirm with the
caterer for final booking."*

## Consumer flow

1. **Landing page** explains what the site does and drives into the guided flow.
2. **Guided flow (`/find`)**, one question per step: plates → preferred cuisine
   (multi-select, from the `cuisines` table) → budget per plate → event date → event
   type (from `event_types`). Anonymous — no login.
3. **Matched discovery (`/discover`)**: live vendors ranked by their lowest active
   package price against a ±10% budget band. In-band vendors show first; others show
   below labeled "above"/"below your budget" — the page is never empty. Cuisine
   preference is a soft ranking signal, not a hard filter (same never-empty-screen
   reasoning). Sortable by price low-to-high. Cards show packages (name, price) only,
   never loose menu items. Every rating is labeled "Google rating" explicitly.
4. **Vendor profile**: Google rating, description/logo/media when the vendor has
   them, packages as selectable cards, full dish-level menu (always visible, per
   product rule below), sticky bottom bar with "Enquire for booking" and "Get sample
   box" — always visible, never scrolls away.
5. **Capture**: both CTAs open a modal asking only for a phone number (10-digit
   Indian format). Enquire inserts into `enquiries` with the full guided-flow context
   (plates/cuisines/budget/date/event type/selected package/quote); sample box inserts
   the same context into `tasting_requests.context` (jsonb). Max 10 enquiries per
   phone per day, enforced server-side.

## Vendor flow

- Go-live gate: **at least one active package.** Everything else — menu items, media,
  description, pricing tiers (deprecated) — is optional. An unmet gate shows exactly
  what's missing.
- Packages are built two ways, on the same package: by category rule (slots like "any
  2 from Starters") or by picking exact dishes directly. Optional `min_plates`.
- Menu: 14 standard categories can be one-click provisioned per vendor, with common
  Telugu wedding/party dish suggestions per category (one-click add, price set after).
  Bulk CSV import (`category, dish_name, price_pp`) creates categories + dishes in one
  upload with row-level error reporting.
- Cuisine and event specialities are multi-select (max 2) from shared lookup tables
  (`cuisines`, `event_types`); admins can add new options inline.
- Showcase: optional description, logo, and media images (Supabase Storage,
  `vendor-media` bucket, public read) — shown on the profile when present.

## Admin flow

- Pipeline: any vendor, filterable by status, searchable by name/area. Status is a
  free dropdown — any transition, forward or backward (going *to* `live` still runs
  the go-live gate). Delete vendor with a confirmation dialog.
- Vendor pipeline still tracks a loose sourced → contacted → onboarding → priced →
  live progression, but nothing enforces the order anymore.
- Enquiry inbox and tasting-request list, both with admin-editable status.
- 6 demo vendors (`is_demo = true`) exist for showcasing the product; flagged with a
  "Demo" badge in admin only (never on the public site — the consumer queries don't
  even select `is_demo`), with a one-click "delete all demo vendors" action.
- No validation score, no orders-completed display.

## Pricing

`packages.base_price_pp` and `menu_items.base_price_pp` are prices **per plate at 500
plates**. `pricing_tiers` is deprecated — the table exists but no application code
reads it. (A platform-wide dynamic multiplier based on plate count may replace flat
pricing later; if so, this section is the source of truth for the current formula.)

## Decisions locked

Instant quotes with 10–15% disclaimer; budget-band matching with soft cuisine
ranking, never an empty results screen; 10 enquiries/day cap; package-required
go-live gate; anonymous browse + phone-gated capture; demo vendors admin-only and
bulk-deletable; service-role key server-side only, never in consumer paths.

## Out of scope until told otherwise

Canonical/standardised cross-vendor dish database, menu-first search, payments,
vendor validation scores, orders-completed counts, media-freshness enforcement,
serviceability filters as a user-facing constraint, OTP verification on phone
capture, vendor-side accept/decline logistics beyond status fields.
