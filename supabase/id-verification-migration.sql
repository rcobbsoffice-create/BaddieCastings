-- Run this in Supabase Dashboard → SQL Editor
-- Adds ID verification columns + creates the ids storage bucket

alter table profiles
  add column if not exists id_front_url text,
  add column if not exists id_back_url  text,
  add column if not exists id_verified  boolean not null default false;
