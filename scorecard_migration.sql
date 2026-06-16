-- ============================================================
-- NSO Portal - Scorecard Migration
-- Review this file, then run it manually in Supabase SQL Editor.
--
-- This migration is additive:
-- - Creates the scorecards table (one row per opening).
-- - Does not touch any existing tables.
-- ============================================================

create table if not exists public.scorecards (
  id uuid default gen_random_uuid() primary key,
  opening_id uuid not null references public.openings(id) on delete cascade,
  leadership_training_id uuid references public.leadership_trainings(id) on delete set null,
  elearning_pct integer check (elearning_pct is null or elearning_pct between 0 and 100),
  t1_total integer check (t1_total is null or t1_total >= 0),
  t1_process_confusion integer check (t1_process_confusion is null or t1_process_confusion >= 0),
  brain_dump text,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opening_id)
);

create index if not exists scorecards_opening_idx on public.scorecards(opening_id);
create index if not exists scorecards_lt_idx on public.scorecards(leadership_training_id);

alter table public.scorecards enable row level security;

drop policy if exists "scorecards_admin" on public.scorecards;
create policy "scorecards_admin" on public.scorecards
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
