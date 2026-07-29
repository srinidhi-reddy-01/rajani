-- Uploads now go directly from the browser to Storage via a signed URL (bypassing
-- Vercel's serverless function body limit entirely - see actions.ts), so the 20MB
-- video cap can no longer be enforced by reading file.size in a Server Action (the
-- server never sees the bytes). Enforcing it at the bucket level means Storage itself
-- rejects an oversized upload before the object is created - no orphaned files, no
-- app-layer check to bypass. 20MB covers every upload type in this bucket (photos
-- included - nothing here legitimately needs more).
update storage.buckets set file_size_limit = 20971520 where id = 'vendor-media';
