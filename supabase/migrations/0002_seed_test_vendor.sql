-- Seed: one fully-priced, live test vendor so Phase 1 has data to render.
-- All base_price_pp values are at the 500-plate baseline (see 0001_initial_schema.sql).

insert into vendors (
  name, slug, phone, address, area,
  gbp_rating, gbp_rating_count, established_year,
  cuisine_specialities, event_specialities,
  serviceable_everywhere, pricing_model, status
) values (
  'Annapurna Caterers', 'annapurna-caterers', '+91 90000 00000', 'Road No. 12, Banjara Hills', 'Banjara Hills',
  4.6, 128, 2005,
  array['Andhra', 'North Indian'], array['Wedding', 'Corporate event'],
  true, 'flexible', 'live'
);

insert into pricing_tiers (vendor_id, min_plates, max_plates, adjustment_pct)
select (select id from vendors where slug = 'annapurna-caterers'), min_plates, max_plates, adjustment_pct
from (values
  (100, 299, 4.00),
  (300, 499, 2.00),
  (500, 699, 0.00),
  (700, 1000, -2.00)
) as t(min_plates, max_plates, adjustment_pct);

insert into menu_categories (vendor_id, name, sort_order)
select (select id from vendors where slug = 'annapurna-caterers'), name, sort_order
from (values
  ('Starters', 1),
  ('Curries', 2),
  ('Rice & Breads', 3),
  ('Desserts', 4)
) as t(name, sort_order);

insert into menu_items (vendor_id, category_id, name, is_veg, meal_types, base_price_pp)
select
  (select id from vendors where slug = 'annapurna-caterers'),
  (select id from menu_categories where vendor_id = (select id from vendors where slug = 'annapurna-caterers') and name = t.category),
  t.name, t.is_veg, t.meal_types::meal_type[], t.base_price_pp
from (values
  ('Starters', 'Veg Manchurian', true, array['dinner'], 120.00),
  ('Starters', 'Chicken 65', false, array['dinner'], 180.00),
  ('Curries', 'Paneer Butter Masala', true, array['lunch','dinner'], 150.00),
  ('Curries', 'Chicken Curry', false, array['lunch','dinner'], 220.00),
  ('Curries', 'Dal Tadka', true, array['lunch','dinner'], 90.00),
  ('Rice & Breads', 'Veg Biryani', true, array['lunch','dinner'], 140.00),
  ('Rice & Breads', 'Chicken Biryani', false, array['lunch','dinner'], 200.00),
  ('Rice & Breads', 'Butter Naan', true, array['lunch','dinner'], 40.00),
  ('Desserts', 'Double ka Meetha', true, array['lunch','dinner'], 80.00),
  ('Desserts', 'Gulab Jamun', true, array['lunch','dinner'], 60.00)
) as t(category, name, is_veg, meal_types, base_price_pp);

insert into packages (vendor_id, name, description, base_price_pp, is_default, is_active)
values
  (
    (select id from vendors where slug = 'annapurna-caterers'),
    'Classic Wedding Package',
    '2 starters, 2 curries, rice & breads, 1 dessert',
    650.00, true, true
  ),
  (
    (select id from vendors where slug = 'annapurna-caterers'),
    'Corporate Lunch Package',
    'Lighter menu suited for weekday office lunches',
    450.00, false, true
  );

insert into package_slots (package_id, category_id, selections_count, sort_order)
select
  (select id from packages where vendor_id = (select id from vendors where slug = 'annapurna-caterers') and name = 'Classic Wedding Package'),
  (select id from menu_categories where vendor_id = (select id from vendors where slug = 'annapurna-caterers') and name = t.category),
  t.selections_count, t.sort_order
from (values
  ('Starters', 2, 1),
  ('Curries', 2, 2),
  ('Rice & Breads', 2, 3),
  ('Desserts', 1, 4)
) as t(category, selections_count, sort_order);

insert into package_slot_items (slot_id, item_id, is_default)
select
  (select ps.id from package_slots ps
    join menu_categories mc on mc.id = ps.category_id
    where ps.package_id = (select id from packages where vendor_id = (select id from vendors where slug = 'annapurna-caterers') and name = 'Classic Wedding Package')
    and mc.name = t.category),
  (select id from menu_items where vendor_id = (select id from vendors where slug = 'annapurna-caterers') and name = t.item_name),
  t.is_default
from (values
  ('Starters', 'Veg Manchurian', true),
  ('Starters', 'Chicken 65', false),
  ('Curries', 'Paneer Butter Masala', true),
  ('Curries', 'Chicken Curry', false),
  ('Curries', 'Dal Tadka', false),
  ('Rice & Breads', 'Veg Biryani', true),
  ('Rice & Breads', 'Butter Naan', true),
  ('Rice & Breads', 'Chicken Biryani', false),
  ('Desserts', 'Gulab Jamun', true)
) as t(category, item_name, is_default);
