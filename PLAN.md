# Rajani — Hyderabad Catering Marketplace

Core promise: **real packages, real prices, no login required.** Land on live-filtering
discovery immediately — no interstitial form — and every filter is optional. Every quote
carries the disclaimer: *"Actual price may vary by 10–15% based on dish changes and
plate-count updates. Please confirm with the caterer for final booking."*

## Consumer flow

1. **Landing page** explains what the site does; its main CTA goes straight to
   `/discover`. Below the hero, a three-card "Every host worries about three
   things" section (Taste / Presentation / Trust in price) and a full-width
   emotional band lead into the existing feature grid. A visually distinct
   "Too busy to browse?" band (contrasting fill, its own heading, clearly broken
   out from the surrounding content) captures a `match_requests` row for users
   who'd rather have the team match them manually; event type and cuisine there
   are plain single-select dropdowns.
2. **Discovery (`/discover`)**: the live vendor list is fetched once, server-side;
   all filtering, ranking, and price computation happens client-side
   (`lib/matching.ts`, a pure function - no DB access), so prices recompute instantly
   with zero network round-trips as filters change. Event type and cuisine are
   multi-select dropdowns (a combobox with checkboxes and a compact "N selected"
   summary, `MultiSelectDropdown`), kept out of the horizontally-scrolling chip
   row so their popovers aren't clipped. Plates stepper (50s + direct typing,
   default 500), budget, event date, and sort stay as icon-led chips in that row.
   Every filter is optional. Live vendors rank by their lowest active package
   price against a ±10% budget band: in-band first, others below labeled
   "above"/"below your budget" - never an empty screen. Cuisine and event-type
   preference are soft ranking signals, not hard filters, same reasoning: a
   vendor matching neither still shows, just below a subtle "Also available"
   divider within whichever budget group it landed in (matches on cuisine OR
   event type, not both required). A "Clear all filters" link appears once any
   filter (cuisine, event type, budget, date, or sort) is active. Cards show a
   circular owner photo overlapping the cover image (falls back to the vendor's
   logo, then a gradient initials badge - never an empty box), a green Verified
   badge (when personally vetted), events completed, Google rating, locality,
   cuisine chips, and "Packages from ₹X/plate at your Y plates" - never a loose
   dish price. The same distinct "Too busy to browse?" band repeats at the
   bottom.
3. **Vendor profile**: hero cover photo, "Serving since {year}", Google rating,
   description, gallery ("Presentation"), testimonials ("What hosts say" -
   admin-uploaded WhatsApp screenshots), a ₹1000-off-your-booking-value banner,
   and packages as selectable cards (the only place a price is public). There is
   no standalone dish-name "Menu" section - the package selector (see below) is
   the only menu representation on the page, and it never shows a price. Sticky
   bottom bar: "Get sample box" (with a one-line explainer echoing the Taste
   pillar) and "Check availability" (its modal mentions the dedicated event
   manager) - always enabled, never blocked by menu selection.
4. **Menu customisation**: picking a package with category-rule slots shows
   "Choose menu items to get the exact quote" **expanded by default** - there is
   no collapse toggle. One section per slot (category, "Pick N · M selected",
   items as image+name cards with defaults preselected) plus a live per-plate
   quote. Users never need to manually unselect before picking something else: a
   pick-1 slot swaps like a radio button, and a pick-N slot at capacity drops the
   oldest pick (FIFO) to make room for the new one, with a brief transition. This
   is a pure enhancement: "Check availability" works identically with a package
   alone, a customised selection, or no package at all. Because the chooser is
   always expanded, the enquiry always carries the itemised selection whenever
   the package has slots - defaults if the user never touched anything, their
   own picks if they did.
5. **Capture**: both CTAs open a modal asking only for a phone number (10-digit
   Indian format), ending "Thank you, our team will get in touch with you for the
   next steps." Check availability inserts into `enquiries` with the full context
   (plates/cuisines/budget/date/event type/selected package/itemised selection if
   any/quote); sample box inserts the same shape into `tasting_requests.context`
   (jsonb). Max 10 enquiries per phone per day, enforced server-side.

## Vendor flow

- Go-live gate: **at least one active package.** Everything else is optional. An
  unmet gate shows exactly what's missing.
- Packages are built two ways, on the same package: by category rule (a slot per
  category with a pick count - new slots default to offering every active item in
  that category, admin removes some to restrict) or by picking exact dishes directly.
  Optional `min_plates`. Veg/non-veg split categories ("Starters veg" / "Starters
  non-veg") are the intended pattern for mixed menus. In the admin editor, each
  menu category and each package is its own collapsed-by-default accordion row
  (name + item count, or name + price + status badges) - keeps a vendor with a
  large menu or several multi-slot packages from turning into one very long page.
- Menu: 14 standard categories can be one-click provisioned per vendor, with common
  Telugu wedding/party dish suggestions per category (one-click add at no price -
  "priced later" is a real state; `base_price_pp` is nullable). Bulk CSV import
  (`category, dish_name, price_pp`) with row-level error reporting. Dishes may
  optionally carry an `image_url`, shown in the package selector - never a price,
  on the consumer side.
- Cuisine and event specialities are multi-select (max 2) from shared lookup tables
  (`cuisines`, `event_types`); admins can add new options inline.
- Showcase: description, logo, **owner photo** (shown circular, overlapping the
  cover image on cards), **events completed**, **verified** (a manual admin toggle -
  "personally vetted by the Rajani team," never automatic or self-reported), and
  media images (Supabase Storage, `vendor-media` bucket, public read) - split into
  gallery photos and testimonial (WhatsApp screenshot) uploads via a `kind` column.

## Admin flow

- Pipeline: any vendor, filterable by status, searchable by name/area. Status is a
  free dropdown - any transition, forward or backward (going *to* `live` still runs
  the go-live gate). Delete vendor with a confirmation dialog.
- Enquiry inbox, tasting-request list, and **match-request list** - all three show
  their full captured context (event, date, plates, budget, cuisine, package,
  itemised selection if any) as detail cards, not a narrow table.
- Demo vendors (`is_demo = true`) exist for showcasing the product - flagged with a
  "Demo" badge in admin only (never on the public site - the consumer queries don't
  even select `is_demo`), with a one-click "delete all demo vendors" action.
- No validation score, no orders-completed *ranking* (events-completed is a display
  count, not a sort factor).

## Pricing

`packages.base_price_pp` and `menu_items.base_price_pp` are prices **per plate at 500
plates** - the admin panel says so everywhere a price is entered, and dish price is
optional (nullable) while a package's is required. `pricing_tiers` is deprecated; the
table exists but no application code reads it.

Every user-facing price is computed from the baseline via a single platform-wide
multiplier, `getPlateMultiplier(plates)` in `lib/pricing.ts`:

- 500 plates → base price (multiplier 1).
- Piecewise linear, **not** one straight line: 100 → 1000 has a kink at 500, because
  the three anchor points (100 → +10%, 500 → 0%, 1000 → −10%) aren't collinear. The
  100→500 segment moves −2.5%/100 plates; the 500→1000 segment moves −2%/100 plates.
- Below 100 plates, clamp at +10%. Above 1000 plates, clamp at −10%.
- Reference points: 300 plates ≈ +5%, 750 plates ≈ −5%.

Used everywhere a price renders: discovery cards, vendor profiles, package prices,
and the quote stored on an enquiry/tasting request. Unit tested at 50, 100, 300, 500,
750, 1000, and 1500 plates (`lib/pricing.test.ts`, `npm test`).

## Decisions locked

Packages are the only public price - dish prices never render on the consumer site.
"Check availability" is the CTA name everywhere, always enabled regardless of menu
customisation. Budget-band matching with soft cuisine ranking, never an empty results
screen. 10 enquiries/day cap. Package-required go-live gate. Anonymous browse +
phone-gated capture. `is_verified` is a manual, admin-only signal. Demo vendors
admin-only and bulk-deletable. Service-role key server-side only, never in consumer
paths. Apple-inspired visual language: system font stack (no serif), one restrained
accent color reserved for prices and primary CTAs, everything else neutral - see
CLAUDE.md's Design system section before touching any styling.

## Parked concepts

Noted for later, not built:

- **Referral incentives** - inviting other hosts/vendors for a reward. No mechanism
  designed yet.
- **Cashback mechanics** - the ₹1000 cashback banner on vendor profiles is currently
  marketing copy only; there's no automated payout, eligibility check, or tracking
  behind it. Needs a manual process (or a future `cashback_claims` table) before it's
  a real offer rather than a promise.
- **Chef-at-home vertical** - a separate booking flow for in-home private chefs
  (smaller scale than event catering), similar in spirit to ChefKart's model. Would
  likely need its own vendor type, pricing unit (per-meal/per-person vs. per-plate at
  500), and probably a separate discovery surface rather than folding into the
  existing caterer matching.

## Out of scope until told otherwise

Canonical/standardised cross-vendor dish database, menu-first search, payments,
vendor validation scores as a ranking factor, media-freshness enforcement,
serviceability filters as a user-facing constraint, OTP verification on phone
capture, vendor-side accept/decline logistics beyond status fields.
