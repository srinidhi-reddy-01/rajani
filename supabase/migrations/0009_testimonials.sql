-- Testimonials: admin-uploaded WhatsApp screenshots, shown on the profile as "What
-- hosts say". Reuses vendor_media (same storage bucket, same upload plumbing) rather
-- than a new table - a `kind` column is enough to tell gallery photos apart.
alter table vendor_media
  add column kind text not null default 'gallery' check (kind in ('gallery', 'testimonial'));
