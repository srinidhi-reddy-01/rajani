-- Singleton site-wide settings row (id fixed at 1). Currently just the SRP/discovery
-- card fallback cover image override, admin-editable instead of the hardcoded
-- Unsplash pool in lib/images.ts. Public read (consumer pages resolve the fallback
-- server-side with the anon client); only the service-role admin client ever writes.
create table site_settings (
  id smallint primary key default 1 check (id = 1),
  fallback_cover_image_url text,
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values (1);

alter table site_settings enable row level security;

create policy "public read site settings" on site_settings
  for select using (true);
