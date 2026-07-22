-- Rebuild demo vendor menus/packages around package_slots so the consumer package
-- selector (pick N per category) is fully demonstrable. Categories are split by
-- veg/non-veg per the admin package-builder spec. Same shared template across all 6
-- demo vendors for consistency; only pricing/description differ, as before.

delete from packages where vendor_id in (select id from vendors where is_demo);
delete from menu_categories where vendor_id in (select id from vendors where is_demo);

-- ---------- Categories ----------

insert into menu_categories (vendor_id, name, sort_order)
select v.id, c.name, c.sort_order
from vendors v
join (values
  ('Welcome drinks', 1), ('Starters veg', 2), ('Starters non-veg', 3), ('Soups', 4),
  ('Main curries veg', 5), ('Main curries non-veg', 6), ('Rice & biryani', 7),
  ('Breads', 8), ('Desserts', 9)
) as c(name, sort_order) on true
where v.is_demo;

-- ---------- Items (3 per category, so "pick up to 3" packages have real choice) ----------

insert into menu_items (vendor_id, category_id, name, is_veg, meal_types, base_price_pp)
select mc.vendor_id, mc.id, t.name, t.is_veg, t.meal_types::meal_type[], t.base_price_pp
from menu_categories mc
join vendors v on v.id = mc.vendor_id and v.is_demo
join (values
  ('Welcome drinks', 'Buttermilk (Majjiga)', true, array['lunch','dinner'], 40.00),
  ('Welcome drinks', 'Mango Panna', true, array['lunch','dinner'], 50.00),
  ('Welcome drinks', 'Rose Milk', true, array['lunch','dinner'], 45.00),
  ('Starters veg', 'Gobi 65', true, array['dinner'], 140.00),
  ('Starters veg', 'Paneer Tikka', true, array['dinner'], 160.00),
  ('Starters veg', 'Veg Manchurian', true, array['dinner'], 130.00),
  ('Starters non-veg', 'Chicken 65', false, array['dinner'], 190.00),
  ('Starters non-veg', 'Chicken Lollipop', false, array['dinner'], 200.00),
  ('Starters non-veg', 'Mutton Sukka', false, array['dinner'], 240.00),
  ('Soups', 'Hot & Sour Soup', true, array['dinner'], 90.00),
  ('Soups', 'Sweet Corn Soup', true, array['dinner'], 85.00),
  ('Soups', 'Tomato Shorba', true, array['dinner'], 80.00),
  ('Main curries veg', 'Dal Tadka', true, array['lunch','dinner'], 110.00),
  ('Main curries veg', 'Gutti Vankaya Kura', true, array['lunch','dinner'], 140.00),
  ('Main curries veg', 'Paneer Butter Masala', true, array['lunch','dinner'], 160.00),
  ('Main curries non-veg', 'Chicken Chettinad', false, array['lunch','dinner'], 220.00),
  ('Main curries non-veg', 'Chicken Curry', false, array['lunch','dinner'], 230.00),
  ('Main curries non-veg', 'Mutton Curry', false, array['lunch','dinner'], 280.00),
  ('Rice & biryani', 'Bagara Rice', true, array['lunch','dinner'], 100.00),
  ('Rice & biryani', 'Chicken Biryani', false, array['lunch','dinner'], 210.00),
  ('Rice & biryani', 'Veg Biryani', true, array['lunch','dinner'], 150.00),
  ('Breads', 'Butter Naan', true, array['lunch','dinner'], 40.00),
  ('Breads', 'Phulka', true, array['lunch','dinner'], 25.00),
  ('Breads', 'Poori', true, array['lunch','dinner'], 30.00),
  ('Desserts', 'Double ka Meetha', true, array['lunch','dinner'], 85.00),
  ('Desserts', 'Gulab Jamun', true, array['lunch','dinner'], 70.00),
  ('Desserts', 'Kesari Bath', true, array['lunch','dinner'], 75.00)
) as t(category, name, is_veg, meal_types, base_price_pp)
  on t.category = mc.name;

-- ---------- Packages: same 3 price points as before ----------

insert into packages (vendor_id, name, description, base_price_pp, is_default, is_active)
select v.id, p.name, p.description, p.base_price_pp, p.is_default, true
from vendors v
join (values
  ('Essential', 'Simple vegetarian-leaning package', 480.00, false),
  ('Classic Wedding', 'Balanced veg + non-veg wedding spread', 680.00, true),
  ('Premium Banquet', 'Full spread with live counters', 920.00, false)
) as p(name, description, base_price_pp, is_default) on true
where v.is_demo;

-- ---------- Package slots: category + how many to pick, per package tier ----------

insert into package_slots (package_id, category_id, selections_count, sort_order)
select p.id, mc.id, s.selections_count, s.sort_order
from packages p
join vendors v on v.id = p.vendor_id and v.is_demo
join menu_categories mc on mc.vendor_id = v.id
join (values
  ('Essential', 'Starters veg', 1, 1),
  ('Essential', 'Main curries veg', 2, 2),
  ('Essential', 'Rice & biryani', 1, 3),
  ('Essential', 'Desserts', 1, 4),
  ('Classic Wedding', 'Welcome drinks', 1, 1),
  ('Classic Wedding', 'Starters veg', 2, 2),
  ('Classic Wedding', 'Starters non-veg', 2, 3),
  ('Classic Wedding', 'Main curries veg', 2, 4),
  ('Classic Wedding', 'Main curries non-veg', 1, 5),
  ('Classic Wedding', 'Rice & biryani', 1, 6),
  ('Classic Wedding', 'Breads', 1, 7),
  ('Classic Wedding', 'Desserts', 2, 8),
  ('Premium Banquet', 'Welcome drinks', 1, 1),
  ('Premium Banquet', 'Starters veg', 2, 2),
  ('Premium Banquet', 'Starters non-veg', 3, 3),
  ('Premium Banquet', 'Soups', 1, 4),
  ('Premium Banquet', 'Main curries veg', 2, 5),
  ('Premium Banquet', 'Main curries non-veg', 2, 6),
  ('Premium Banquet', 'Rice & biryani', 2, 7),
  ('Premium Banquet', 'Breads', 1, 8),
  ('Premium Banquet', 'Desserts', 2, 9)
) as s(package_name, category_name, selections_count, sort_order)
  on s.package_name = p.name and s.category_name = mc.name;

-- ---------- Package slot items: every item in the category is offered (task default),
-- the first `selections_count` (alphabetically) start preselected ----------

insert into package_slot_items (slot_id, item_id, is_default)
select ps.id, mi.id, row_number() over (partition by ps.id order by mi.name) <= ps.selections_count
from package_slots ps
join packages p on p.id = ps.package_id
join vendors v on v.id = p.vendor_id and v.is_demo
join menu_items mi on mi.category_id = ps.category_id and mi.vendor_id = v.id;
