-- Project Catering: Phase 0 schema
-- Baseline pricing: every price is per-plate at the 500-plate baseline.
-- Prices at other plate counts = base price * (1 + adjustment_pct/100) from pricing_tiers.
-- Phase 4 (canonical dish DB, tags, cross-vendor matching) is deliberately NOT in this schema.

-- ---------- Enums ----------

create type vendor_status as enum ('sourced', 'contacted', 'onboarding', 'priced', 'live', 'paused');
create type pricing_model as enum ('final', 'flexible');
create type enquiry_status as enum ('new', 'accepted', 'declined', 'booked', 'expired');
create type tasting_status as enum ('new', 'contacted', 'completed', 'cancelled');
create type meal_type as enum ('breakfast', 'lunch', 'dinner');

-- Event types kept as a lookup table (PRD requirement) so admin can add more without migrations.
create table event_types (
  id serial primary key,
  name text not null unique
);

insert into event_types (name) values
  ('Wedding'), ('Birthday party'), ('Corporate event'),
  ('Saree/Dhoti ceremony'), ('Wedding related event'), ('Cradle ceremony'), ('Pooja event'), ('Other');

-- ---------- Vendors ----------

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  address text,
  area text,
  -- Google Business Profile (refreshed weekly by admin job; only place_id stored permanently per ToS)
  gbp_place_id text unique,
  gbp_rating numeric(2,1),
  gbp_rating_count integer,
  established_year integer,
  -- Max 2 each, per plan
  cuisine_specialities text[] not null default '{}' check (cardinality(cuisine_specialities) <= 2),
  event_specialities text[] not null default '{}' check (cardinality(event_specialities) <= 2),
  -- Declared, stored, but NOT a user-facing filter yet
  serviceable_everywhere boolean not null default true,
  serviceable_areas text[] not null default '{}',
  pricing_model pricing_model not null default 'flexible',
  -- Pipeline: sourced -> contacted -> onboarding -> priced -> live. Only 'live' is visible to consumers.
  status vendor_status not null default 'sourced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendor_media (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  url text not null,
  event_date date,
  created_at timestamptz not null default now()
);

-- ---------- Menu (per-vendor, as-is; no canonical dishes yet) ----------

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  unique (vendor_id, name)
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  category_id uuid not null references menu_categories(id) on delete cascade,
  name text not null,
  is_veg boolean not null default true,
  meal_types meal_type[] not null default '{lunch,dinner}',
  -- Per-plate price at the 500-plate baseline. Visible to users (transparency is the product).
  base_price_pp numeric(8,2) not null check (base_price_pp >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Admin-set plate-count adjustment bands, e.g. (100, 299, +4.00), (300, 499, +2.00), (500, 699, 0), (700, 1000, -2.00)
create table pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  min_plates integer not null check (min_plates > 0),
  max_plates integer not null,
  adjustment_pct numeric(5,2) not null default 0,
  check (max_plates >= min_plates)
);

-- ---------- Packages ----------

create table packages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  description text,
  -- Per-plate package price at 500-plate baseline
  base_price_pp numeric(8,2) not null check (base_price_pp >= 0),
  -- The default package powers the instant quote on the vendor's discovery card. One per vendor.
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index one_default_package_per_vendor on packages (vendor_id) where is_default;

-- A slot = "pick N from this category" (e.g. 2 starters, 3 curries)
create table package_slots (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages(id) on delete cascade,
  category_id uuid not null references menu_categories(id) on delete cascade,
  selections_count integer not null default 1 check (selections_count > 0),
  sort_order integer not null default 0
);

create table package_slot_items (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references package_slots(id) on delete cascade,
  item_id uuid not null references menu_items(id) on delete cascade,
  is_default boolean not null default false,
  unique (slot_id, item_id)
);

-- ---------- Enquiries & tasting ----------

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete restrict,
  -- Phone required to enquire; browsing is anonymous. Cap: max 10 enquiries per phone per day (app-enforced).
  user_phone text not null,
  user_name text,
  event_type text not null,
  event_date date not null,
  location text,
  plates integer not null check (plates > 0),
  meal_type meal_type not null,
  budget_pp numeric(8,2),
  -- Snapshot of the user's selection: [{item_id, name, price_pp}] or {package_id, swaps: [...]}
  menu_selection jsonb not null,
  -- Quote computed at enquiry time; this is the price that stands (within the 10-15% disclaimer band)
  quoted_pp numeric(8,2) not null,
  -- Vendor 'accepted' doubles as availability confirmation for event_date
  status enquiry_status not null default 'new',
  vendor_responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index enquiries_cap_check on enquiries (user_phone, created_at);
create index enquiries_vendor_inbox on enquiries (vendor_id, status, created_at desc);

create table tasting_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete restrict,
  user_phone text not null,
  user_name text,
  -- MVP: user sees "Our team will contact you"; admin handles everything manually
  status tasting_status not null default 'new',
  created_at timestamptz not null default now()
);

-- ---------- updated_at trigger ----------

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vendors_updated_at before update on vendors
  for each row execute function set_updated_at();

-- ---------- Row-level security ----------
-- Consumers use the anon key: read-only on live vendors' data, insert-only on enquiries/tastings.
-- Admin (Sri) and server jobs use the service-role key, which bypasses RLS entirely.

alter table vendors enable row level security;
alter table vendor_media enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table pricing_tiers enable row level security;
alter table packages enable row level security;
alter table package_slots enable row level security;
alter table package_slot_items enable row level security;
alter table enquiries enable row level security;
alter table tasting_requests enable row level security;
alter table event_types enable row level security;

create policy "public read live vendors" on vendors
  for select using (status = 'live');

create policy "public read media of live vendors" on vendor_media
  for select using (exists (select 1 from vendors v where v.id = vendor_id and v.status = 'live'));

create policy "public read categories of live vendors" on menu_categories
  for select using (exists (select 1 from vendors v where v.id = vendor_id and v.status = 'live'));

create policy "public read items of live vendors" on menu_items
  for select using (is_active and exists (select 1 from vendors v where v.id = vendor_id and v.status = 'live'));

create policy "public read tiers of live vendors" on pricing_tiers
  for select using (exists (select 1 from vendors v where v.id = vendor_id and v.status = 'live'));

create policy "public read packages of live vendors" on packages
  for select using (is_active and exists (select 1 from vendors v where v.id = vendor_id and v.status = 'live'));

create policy "public read slots of live packages" on package_slots
  for select using (exists (
    select 1 from packages p join vendors v on v.id = p.vendor_id
    where p.id = package_id and p.is_active and v.status = 'live'));

create policy "public read slot items of live packages" on package_slot_items
  for select using (exists (
    select 1 from package_slots s
    join packages p on p.id = s.package_id
    join vendors v on v.id = p.vendor_id
    where s.id = slot_id and p.is_active and v.status = 'live'));

create policy "public read event types" on event_types for select using (true);

create policy "anyone can create an enquiry" on enquiries for insert with check (true);
create policy "anyone can request a tasting" on tasting_requests for insert with check (true);
-- No anon select/update on enquiries or tastings: users get confirmation in-app;
-- vendor inbox and admin views run server-side with the service-role key for now.
