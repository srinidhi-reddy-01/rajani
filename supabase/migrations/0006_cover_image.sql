-- Design elevation: a curated cover photo per vendor. Nullable - the consumer UI falls
-- back to a themed gradient (and, for demo vendors, one of a small curated Unsplash pool)
-- when unset, so this never blocks a vendor from looking complete.
alter table vendors
  add column cover_image_url text;

update vendors
set cover_image_url = m.url
from (
  values
    ('sri-lakshmi-caterers-demo', 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1200&q=80&auto=format&fit=crop'),
    ('grand-telangana-kitchens', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200&q=80&auto=format&fit=crop'),
    ('vasavi-annapurna-caterers', 'https://images.unsplash.com/photo-1777613112895-139720bd43c9?w=1200&q=80&auto=format&fit=crop'),
    ('deccan-feast-caterers', 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=1200&q=80&auto=format&fit=crop'),
    ('royal-nizam-caterers', 'https://images.unsplash.com/photo-1559528896-c5310744cce8?w=1200&q=80&auto=format&fit=crop'),
    ('konaseema-ruchulu-caterers', 'https://images.unsplash.com/photo-1633945274309-2c16c9682a8c?w=1200&q=80&auto=format&fit=crop')
) as m(slug, url)
where vendors.slug = m.slug;
