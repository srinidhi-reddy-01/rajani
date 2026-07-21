# Project Catering — Vendor-First Plan

Hyderabad catering marketplace. Core promise: **quotations at the user's fingertips** — every price computed instantly from vendor pricing data, with the standing disclaimer: *"Actual price may vary by 10–15% based on dish changes and plate-count updates. Please confirm with the caterer for final booking."* Vendor confirmation happens only once, at the end.

## Why vendor-first

Menu-first requires a standardised cross-vendor dish database before anything works — the hardest dependency. Vendor-first lets each vendor's menu stay as-is at launch; standardisation returns in Phase 4 as the layer that unlocks cross-vendor matching.

## Consumer flow

1. **Event context capture:** event type, date, location, plates, meal type, optional budget/plate. Anonymous browsing — no login.
2. **Discovery with live prices:** each vendor card shows a computed per-plate quote at the user's plate count (from the vendor's default package). Ranking: equal weightage for now.
3. **Vendor profile:** GBP rating/count, media clips, specialities, packages priced live. CTAs: build menu & get quote, request tasting box.
4. **Menu building:** packages (defaults preselected, swappable within category) or à la carte. Dish prices visible. Per-plate total recalculates on every change.
5. **Compare** 2–3 vendors side by side.
6. **Finalise:** enquiry requires phone number (max 10 enquiries/phone/day). Enquiry = context + selection + computed quote. Vendor reply "accepted" = available on that date + price stands (within disclaimer band). User confirms final booking directly with the caterer. Payment off-platform.
7. **Tasting box:** user leaves phone number on a vendor profile → "Our team will contact you" → admin coordinates manually.

## Vendor flow

- Go-live gate: **fully priced menu** (per-dish per-plate at 500-plate baseline + admin-set plate-count adjustment tiers). Unpriced vendor = invisible.
- Profile: max 2 cuisine specialities, max 2 event specialities, media clips, GBP auto-pulled weekly. Serviceability declared but not a user filter yet.
- Package builder: slots per category ("pick 2 starters") with defaults.
- Enquiry inbox: accept (= available, price stands) / decline. Target response time 24h; admin chases during concierge phase.
- No validation score, no orders-completed display for now.

## Admin flow

- Pipeline: sourced (Places API pull) → contacted → onboarding → priced → live.
- Menu digitisation: raw menus → structured items + categories + prices.
- Sets pricing tiers manually. Oversees all enquiries + tasting requests. Weekly GBP refresh job.
- Hand-curated "most ordered" collections.

## Build phases

- **Phase 0 (current):** repo, Supabase schema, seed data.
- **Phase 1:** read-only marketplace with live computed prices (admin-seeded data).
- **Phase 2:** phone-gated enquiry loop (OTP, 10/day cap), vendor accept/decline, tasting requests.
- **Phase 3:** full menu builder with live recalculation.
- **Phase 4:** canonical dish DB → cross-vendor matching % → menu-first search.

## Decisions locked

Instant quotes with 10–15% disclaimer; leakage/commission consciously deferred; "accepted" = availability; 10 enquiries/day cap; equal-weight ranking; admin-set pricing curves; no validation score; anonymous browse + phone-gated enquiry; serviceability stored not filtered; media freshness ignored; tasting = manual concierge; orders count not shown.

## Open (do not build yet)

Quote staleness policy (price at enquiry time stands), OTP provider choice, ranking algorithm, Phase 4 standardisation design.
