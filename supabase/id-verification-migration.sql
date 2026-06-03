-- Run this in Supabase Dashboard → SQL Editor
-- Adds ID verification columns + creates the ids storage bucket

alter table profiles
  add column if not exists id_front_url text,
  add column if not exists id_back_url  text,
  add column if not exists id_verified  boolean not null default false;

-- Allow service industry sub-roles in the role column
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('talent','creator','agent','agency','admin','bottle_girl','bartender','hookah_girl','dj'));
