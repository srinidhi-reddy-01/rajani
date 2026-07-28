-- Captures the post-discount total (platform DISCOUNT_PERCENT, see lib/pricing.ts) exactly
-- as shown to the user at enquiry time, alongside the existing per-plate quoted_pp - so the
-- price that nudged the user to submit is the price on record, not just the pre-discount
-- per-plate rate. Nullable: legacy rows and any future submission path that doesn't go
-- through the discount UI simply leave it unset.
alter table enquiries add column discounted_total numeric(10,2);
