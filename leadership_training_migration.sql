-- ============================================================
-- NSO Portal - Leadership Training Migration
-- Review this file, then run it manually in Supabase SQL Editor.
--
-- This migration is intentionally additive:
-- - It creates new Leadership Training tables.
-- - It adds one nullable future-link column to openings.
-- - It does not migrate, rename, or change existing NSO data.
-- ============================================================

create extension if not exists pgcrypto;

-- Parent Store Program layer for a future franchise store plus the certified
-- corporate training store where leadership training happens.
create table if not exists public.store_programs (
  id uuid default gen_random_uuid() primary key,
  franchise_store_name text not null,
  certified_training_store_name text not null,
  franchise_owner_name text,
  franchise_company text,
  status text not null default 'active' check (status in ('active', 'complete', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nullable only. Existing NSO openings remain valid and unchanged.
alter table public.openings
  add column if not exists store_program_id uuid references public.store_programs(id) on delete set null;

create table if not exists public.leadership_trainings (
  id uuid default gen_random_uuid() primary key,
  store_program_id uuid not null references public.store_programs(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete set null,
  trainer_name text not null,
  start_date date,
  current_day integer not null default 1 check (current_day between 1 and 5),
  status text not null default 'active' check (status in ('active', 'complete', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leadership_participants (
  id uuid default gen_random_uuid() primary key,
  leadership_training_id uuid not null references public.leadership_trainings(id) on delete cascade,
  name text not null,
  role text not null,
  custom_role text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, leadership_training_id)
);

create table if not exists public.leadership_signoffs (
  id uuid default gen_random_uuid() primary key,
  leadership_training_id uuid not null references public.leadership_trainings(id) on delete cascade,
  participant_id uuid not null,
  competency_id text not null,
  status text not null default 'signed' check (status in ('signed')),
  day_num integer not null check (day_num between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, competency_id),
  constraint leadership_signoffs_participant_fk
    foreign key (participant_id, leadership_training_id)
    references public.leadership_participants(id, leadership_training_id)
    on delete cascade
);

create table if not exists public.leadership_daily_notes (
  id uuid default gen_random_uuid() primary key,
  leadership_training_id uuid not null references public.leadership_trainings(id) on delete cascade,
  day_num integer not null check (day_num between 1 and 5),
  notes_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (leadership_training_id, day_num)
);

create table if not exists public.leadership_readiness_reports (
  id uuid default gen_random_uuid() primary key,
  leadership_training_id uuid not null references public.leadership_trainings(id) on delete cascade,
  participant_id uuid not null,
  readiness_status text check (
    readiness_status is null
    or readiness_status in ('ready', 'ready_with_support', 'needs_additional_training')
  ),
  rating_1_to_4 integer check (rating_1_to_4 is null or rating_1_to_4 between 1 and 4),
  strengths text,
  risks text,
  follow_ups text,
  final_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (leadership_training_id, participant_id),
  constraint leadership_readiness_participant_fk
    foreign key (participant_id, leadership_training_id)
    references public.leadership_participants(id, leadership_training_id)
    on delete cascade
);

create index if not exists store_programs_created_by_idx
  on public.store_programs(created_by);
create index if not exists leadership_trainings_store_program_idx
  on public.leadership_trainings(store_program_id);
create index if not exists leadership_trainings_trainer_idx
  on public.leadership_trainings(trainer_id);
create index if not exists leadership_participants_training_idx
  on public.leadership_participants(leadership_training_id);
create index if not exists leadership_signoffs_training_idx
  on public.leadership_signoffs(leadership_training_id);
create index if not exists leadership_daily_notes_training_idx
  on public.leadership_daily_notes(leadership_training_id);
create index if not exists leadership_readiness_training_idx
  on public.leadership_readiness_reports(leadership_training_id);
create index if not exists openings_store_program_idx
  on public.openings(store_program_id);

alter table public.store_programs enable row level security;
alter table public.leadership_trainings enable row level security;
alter table public.leadership_participants enable row level security;
alter table public.leadership_signoffs enable row level security;
alter table public.leadership_daily_notes enable row level security;
alter table public.leadership_readiness_reports enable row level security;

-- Re-create only Leadership policies so this file can be safely re-run.
drop policy if exists "store_programs_all" on public.store_programs;
drop policy if exists "leadership_trainings_all" on public.leadership_trainings;
drop policy if exists "leadership_participants_all" on public.leadership_participants;
drop policy if exists "leadership_signoffs_all" on public.leadership_signoffs;
drop policy if exists "leadership_daily_notes_all" on public.leadership_daily_notes;
drop policy if exists "leadership_readiness_reports_all" on public.leadership_readiness_reports;

create policy "store_programs_all" on public.store_programs
  for all to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "leadership_trainings_all" on public.leadership_trainings
  for all to authenticated
  using (trainer_id = auth.uid() or public.is_admin())
  with check (trainer_id = auth.uid() or public.is_admin());

create policy "leadership_participants_all" on public.leadership_participants
  for all to authenticated
  using (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_participants.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_participants.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ));

create policy "leadership_signoffs_all" on public.leadership_signoffs
  for all to authenticated
  using (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_signoffs.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_signoffs.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ));

create policy "leadership_daily_notes_all" on public.leadership_daily_notes
  for all to authenticated
  using (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_daily_notes.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_daily_notes.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ));

create policy "leadership_readiness_reports_all" on public.leadership_readiness_reports
  for all to authenticated
  using (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_readiness_reports.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.leadership_trainings lt
    where lt.id = public.leadership_readiness_reports.leadership_training_id
      and (lt.trainer_id = auth.uid() or public.is_admin())
  ));
