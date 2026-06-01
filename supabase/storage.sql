-- =============================================================
-- BADDIE CASTINGS — STORAGE BUCKET + RLS POLICIES
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run: uses ON CONFLICT and DROP IF EXISTS.
-- =============================================================


-- =============================================================
-- 1. CREATE BUCKET
-- =============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,                -- public URLs work without auth token
  52428800,            -- 50 MB per file
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/mov',
    'video/mpeg',
    'video/webm'
  ]
)
on conflict (id) do update set
  public             = true,
  file_size_limit    = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime',
    'video/mov',
    'video/mpeg',
    'video/webm'
  ];


-- =============================================================
-- 2. DROP OLD POLICIES (safe re-run)
-- =============================================================
drop policy if exists "Portfolio media is publicly viewable"              on storage.objects;
drop policy if exists "Users can upload their own portfolio media"        on storage.objects;
drop policy if exists "Users can update their own portfolio media"        on storage.objects;
drop policy if exists "Users can delete their own portfolio media"        on storage.objects;
drop policy if exists "Admins and agencies can manage all portfolio media" on storage.objects;


-- =============================================================
-- 3. RLS POLICIES
-- =============================================================

-- Anyone (including anonymous) can view portfolio files
create policy "Portfolio media is publicly viewable"
  on storage.objects for select
  using (bucket_id = 'portfolio');


-- Authenticated users can upload ONLY into their own folder  ({user_id}/filename)
create policy "Users can upload their own portfolio media"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- Users can replace/update their own files
create policy "Users can update their own portfolio media"
  on storage.objects for update
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- Users can delete their own files
create policy "Users can delete their own portfolio media"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- Admins and agencies can manage ALL portfolio files
create policy "Admins and agencies can manage all portfolio media"
  on storage.objects for all
  using (
    bucket_id = 'portfolio'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'agency')
    )
  );
