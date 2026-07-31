-- The platform discount shown to consumers ("Book through us and get X% off") used to be
-- a single site-wide constant (DISCOUNT_PERCENT in lib/pricing.ts). Different vendors give
-- Rajani different commission, so the discount they fund now varies per vendor - stored as
-- a whole percentage point (10 = 10%), editable in the vendor profile editor. Default 10
-- preserves the previous site-wide behaviour for every existing vendor.
alter table vendors add column discount_percent numeric not null default 10 check (discount_percent >= 0 and discount_percent <= 100);
