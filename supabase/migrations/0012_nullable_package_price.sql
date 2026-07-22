-- A package can now exist before it's priced (mirrors menu_items.base_price_pp,
-- made nullable in 0010 for the same reason: "priced later" is a real onboarding
-- state, not an error). The `base_price_pp >= 0` check still applies to non-null
-- values - Postgres check constraints don't reject NULL.

alter table packages
  alter column base_price_pp drop not null;
