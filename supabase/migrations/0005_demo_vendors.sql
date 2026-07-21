-- Demo vendors: realistic, live, is_demo = true. Visible on the public site (status='live'
-- like any real vendor) but flagged in the admin panel only via is_demo, with a one-click
-- bulk-delete admin action to remove them all later.

insert into vendors (
  name, slug, phone, area, address,
  gbp_rating, gbp_rating_count, established_year,
  cuisine_specialities, event_specialities,
  description, serviceable_everywhere, pricing_model, status, is_demo
) values
  (
    'Sri Lakshmi Caterers (Demo)', 'sri-lakshmi-caterers-demo', '+91 90004 10001', 'Banjara Hills',
    'Road No. 10, Banjara Hills, Hyderabad, Telangana 500034',
    4.7, 312, 2010, array['Telangana', 'Andhra'], array['Wedding', 'Pooja event'],
    'Three generations of home-style Telangana and Andhra cooking, trusted for weddings across Hyderabad.',
    true, 'flexible', 'live', true
  ),
  (
    'Grand Telangana Kitchens', 'grand-telangana-kitchens', '+91 90004 10002', 'Jubilee Hills',
    'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    4.5, 208, 2015, array['Telangana', 'North Indian'], array['Wedding', 'Corporate event'],
    'Large-format wedding and corporate catering with a modern buffet presentation.',
    true, 'flexible', 'live', true
  ),
  (
    'Vasavi Annapurna Caterers', 'vasavi-annapurna-caterers', '+91 90004 10003', 'Kukatpally',
    'KPHB Phase 1, Kukatpally, Hyderabad, Telangana 500072',
    4.8, 521, 2005, array['Andhra', 'South Indian'], array['Wedding', 'Saree/Dhoti ceremony'],
    'Andhra-style pure vegetarian catering, known for authentic pappu-charu and podi varieties.',
    true, 'flexible', 'live', true
  ),
  (
    'Deccan Feast Caterers', 'deccan-feast-caterers', '+91 90004 10004', 'Gachibowli',
    'Financial District, Gachibowli, Hyderabad, Telangana 500032',
    4.3, 156, 2018, array['North Indian', 'Chinese'], array['Birthday party', 'Corporate event'],
    'Contemporary fusion menus for corporate offsites and birthday parties.',
    true, 'flexible', 'live', true
  ),
  (
    'Royal Nizam Caterers', 'royal-nizam-caterers', '+91 90004 10005', 'Secunderabad',
    'S.D. Road, Secunderabad, Telangana 500003',
    4.6, 289, 2008, array['North Indian', 'Continental'], array['Wedding', 'Wedding related event'],
    'Nizami-inspired banquet menus with a dedicated live counters team.',
    true, 'flexible', 'live', true
  ),
  (
    'Konaseema Ruchulu Caterers', 'konaseema-ruchulu-caterers', '+91 90004 10006', 'Madhapur',
    'Hitech City Road, Madhapur, Hyderabad, Telangana 500081',
    4.9, 410, 2012, array['Andhra', 'Telangana'], array['Wedding', 'Cradle ceremony'],
    'Coastal Andhra flavours from Konaseema, famous for their Gongura and seafood-free non-veg spreads.',
    true, 'flexible', 'live', true
  );

-- ---------- Menu: 3 categories x 3-4 items per vendor ----------

insert into menu_categories (vendor_id, name, sort_order)
select v.id, c.name, c.sort_order
from vendors v
join (values ('Starters', 1), ('Main course', 2), ('Rice & biryani', 3), ('Desserts', 4)) as c(name, sort_order)
  on true
where v.is_demo;

insert into menu_items (vendor_id, category_id, name, is_veg, meal_types, base_price_pp)
select
  mc.vendor_id,
  mc.id,
  t.name, t.is_veg, t.meal_types::meal_type[], t.base_price_pp
from menu_categories mc
join vendors v on v.id = mc.vendor_id and v.is_demo
join (
  values
    ('Starters', 'Veg Manchurian', true, array['dinner'], 130.00),
    ('Starters', 'Chicken 65', false, array['dinner'], 190.00),
    ('Starters', 'Paneer Tikka', true, array['dinner'], 160.00),
    ('Main course', 'Paneer Butter Masala', true, array['lunch','dinner'], 160.00),
    ('Main course', 'Chicken Curry', false, array['lunch','dinner'], 230.00),
    ('Main course', 'Gutti Vankaya Kura', true, array['lunch','dinner'], 140.00),
    ('Rice & biryani', 'Veg Biryani', true, array['lunch','dinner'], 150.00),
    ('Rice & biryani', 'Chicken Biryani', false, array['lunch','dinner'], 210.00),
    ('Rice & biryani', 'Bagara Rice', true, array['lunch','dinner'], 100.00),
    ('Desserts', 'Gulab Jamun', true, array['lunch','dinner'], 70.00),
    ('Desserts', 'Double ka Meetha', true, array['lunch','dinner'], 85.00)
) as t(category, name, is_veg, meal_types, base_price_pp)
  on t.category = mc.name;

-- ---------- Packages: 3 price points per vendor, default = middle tier ----------

insert into packages (vendor_id, name, description, base_price_pp, is_default, is_active)
select v.id, p.name, p.description, p.base_price_pp, p.is_default, true
from vendors v
join (
  values
    ('Essential', '2 starters, 2 curries, rice, 1 dessert', 480.00, false),
    ('Classic Wedding', '3 starters, 3 curries, biryani, breads, 2 desserts', 680.00, true),
    ('Premium Banquet', '4 starters, 4 curries, biryani, breads, live counter, 3 desserts', 920.00, false)
) as p(name, description, base_price_pp, is_default)
  on true
where v.is_demo;
