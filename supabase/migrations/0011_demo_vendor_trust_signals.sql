-- Demo vendors demonstrate the full trust-signal set added in #4/#5/#9: owner portraits
-- (pravatar.cc placeholders), events completed, and verification (2 of 6, a believable
-- minority - not every vendor is personally vetted).
update vendors
set owner_photo_url = m.owner_photo_url, events_completed = m.events_completed, is_verified = m.is_verified
from (
  values
    ('sri-lakshmi-caterers-demo', 'https://i.pravatar.cc/300?img=12', 145, true),
    ('grand-telangana-kitchens', 'https://i.pravatar.cc/300?img=33', 89, false),
    ('vasavi-annapurna-caterers', 'https://i.pravatar.cc/300?img=25', 210, true),
    ('deccan-feast-caterers', 'https://i.pravatar.cc/300?img=51', 42, false),
    ('royal-nizam-caterers', 'https://i.pravatar.cc/300?img=14', 178, false),
    ('konaseema-ruchulu-caterers', 'https://i.pravatar.cc/300?img=45', 95, false)
) as m(slug, owner_photo_url, events_completed, is_verified)
where vendors.slug = m.slug;
