-- Schema for items #4/#7/#9/#16: vendor trust signals shown on cards/profile, and the
-- "too busy to browse" match-request capture. Applied early since several checklist
-- items depend on these columns; the corresponding checklist-numbered commits are the
-- application code that reads/writes them.

alter table vendors
  add column owner_photo_url text,
  add column events_completed integer not null default 0 check (events_completed >= 0),
  add column is_verified boolean not null default false;

-- A priced-later dish is a real intermediate state in menu digitisation - price wasn't
-- previously nullable, forcing admins to guess a placeholder number.
alter table menu_items
  alter column base_price_pp drop not null;

create table match_requests (
  id uuid primary key default gen_random_uuid(),
  user_phone text not null,
  user_name text,
  event_type text,
  event_date date,
  plates integer,
  budget_pp numeric(8,2),
  cuisines text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table match_requests enable row level security;

-- Anon can submit a match request but never read them back (admin-only, service-role).
create policy "anyone can submit a match request" on match_requests for insert with check (true);
