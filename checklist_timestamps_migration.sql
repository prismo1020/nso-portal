-- ============================================================
-- NSO Portal - Checklist Timestamps & Partner Notes Migration
-- Run manually in Supabase SQL Editor.
-- Additive only — no existing data is modified.
-- ============================================================

-- 1. Timestamp when each franchise check was completed
alter table public.franchise_checks
  add column if not exists checked_at timestamptz;

-- 2. Signoff dates on leadership training formal confirmations
alter table public.leadership_trainings
  add column if not exists trainer_confirmed_at timestamptz,
  add column if not exists partner_confirmed_at timestamptz;

-- 3. Free-text notes from the franchise partner during sign-off review
alter table public.openings
  add column if not exists partner_review_notes text;
