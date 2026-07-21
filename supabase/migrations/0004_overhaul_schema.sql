-- Major overhaul: vendor showcase fields, cuisines lookup, tasting context,
-- optional package plate minimums, and a public-read storage bucket for
-- vendor logos/media. pricing_tiers is deprecated by this change (superseded
-- by the platform-wide plate-count multiplier) - the table is left in place
-- but is no longer read by any application code.

alter table vendors
  add column description text,
  add column logo_url text,
  add column is_demo boolean not null default false;

create table cuisines (
  id serial primary key,
  name text not null unique
);

insert into cuisines (name) values
  ('Telangana'), ('Andhra'), ('North Indian'), ('South Indian'), ('Chinese'), ('Continental');

alter table cuisines enable row level security;
create policy "public read cuisines" on cuisines for select using (true);

alter table tasting_requests
  add column context jsonb;

alter table packages
  add column min_plates integer check (min_plates is null or min_plates > 0);

insert into storage.buckets (id, name, public)
values ('vendor-media', 'vendor-media', true)
on conflict (id) do nothing;

create policy "public read vendor media" on storage.objects
  for select using (bucket_id = 'vendor-media');
