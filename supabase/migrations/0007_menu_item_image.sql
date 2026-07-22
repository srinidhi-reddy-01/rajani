-- Package-based menu selection needs a dish thumbnail (no price) in the selector.
-- Optional - the consumer UI falls back to a themed placeholder when unset, same
-- pattern as vendors.cover_image_url.
alter table menu_items
  add column image_url text;
