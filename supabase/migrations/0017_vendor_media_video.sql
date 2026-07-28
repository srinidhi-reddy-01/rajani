-- vendor_media (Presentation gallery + testimonials) can now hold videos as well as
-- photos. media_type tells the frontend whether to render <video> or <Image> - it
-- can't be inferred from the url alone since Supabase Storage public URLs don't carry
-- a reliable extension/content-type hint at render time.
alter table vendor_media
  add column media_type text not null default 'image' check (media_type in ('image', 'video'));
