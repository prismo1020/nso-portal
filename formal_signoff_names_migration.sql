-- ============================================================
-- NSO Portal - Formal Sign-Off Names Migration
-- Review this file, then run it manually in Supabase SQL Editor.
--
-- This migration is additive:
-- - Adds a signer-name column to franchise_checks (NSO Partner Review).
-- - Adds trainer/partner confirm + name columns to leadership_trainings
--   (Leadership Training Formal Sign-Off).
-- ============================================================

alter table public.franchise_checks
  add column if not exists signed_name text;

alter table public.leadership_trainings
  add column if not exists trainer_confirmed boolean not null default false,
  add column if not exists trainer_confirmed_name text,
  add column if not exists partner_confirmed boolean not null default false,
  add column if not exists partner_confirmed_name text;
