-- ============================================================
-- NSO Portal — Supabase Schema
-- Paste this entire file into Supabase > SQL Editor > Run
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'coach' check (role in ('coach', 'admin')),
  created_at timestamptz default now()
);

-- Openings (one per NSO event)
create table public.openings (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references public.profiles(id) on delete cascade,
  store_name text not null,
  coach_name text not null,
  start_date date,
  current_day integer default 1 check (current_day between 1 and 5),
  status text default 'active' check (status in ('active', 'complete')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trainees
create table public.trainees (
  id uuid default gen_random_uuid() primary key,
  opening_id uuid references public.openings(id) on delete cascade,
  name text not null,
  role text not null,
  created_at timestamptz default now()
);

-- Sign-offs (one row per trainee+competency)
create table public.signoffs (
  id uuid default gen_random_uuid() primary key,
  opening_id uuid references public.openings(id) on delete cascade,
  trainee_id uuid references public.trainees(id) on delete cascade,
  competency_id text not null,
  status text not null check (status in ('signed', 'needs-work', 'not-met')),
  day_num integer,
  updated_at timestamptz default now(),
  unique(trainee_id, competency_id)
);

-- Daily recaps
create table public.recaps (
  id uuid default gen_random_uuid() primary key,
  opening_id uuid references public.openings(id) on delete cascade,
  day_num integer not null check (day_num between 1 and 5),
  ld_topics text,
  ld_team text,
  tech text,
  ops text,
  sm_notes text,
  tomorrow text,
  actions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(opening_id, day_num)
);

-- Franchise verification checks
create table public.franchise_checks (
  id uuid default gen_random_uuid() primary key,
  opening_id uuid references public.openings(id) on delete cascade,
  check_key text not null,
  checked boolean default false,
  updated_at timestamptz default now(),
  unique(opening_id, check_key)
);

-- ============================================================
-- Auto-create profile row when a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.openings        enable row level security;
alter table public.trainees        enable row level security;
alter table public.signoffs        enable row level security;
alter table public.recaps          enable row level security;
alter table public.franchise_checks enable row level security;

-- Profiles: own row, or admin sees all
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid());

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Openings: coaches see own, admins see all
create policy "openings_all" on public.openings for all to authenticated
  using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid() or public.is_admin());

-- Trainees: inherit from opening ownership
create policy "trainees_all" on public.trainees for all to authenticated
  using (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ));

-- Signoffs: inherit from opening ownership
create policy "signoffs_all" on public.signoffs for all to authenticated
  using (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ));

-- Recaps: inherit from opening ownership
create policy "recaps_all" on public.recaps for all to authenticated
  using (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ));

-- Franchise checks: inherit from opening ownership
create policy "franchise_checks_all" on public.franchise_checks for all to authenticated
  using (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.openings o
    where o.id = opening_id and (o.coach_id = auth.uid() or public.is_admin())
  ));

-- ============================================================
-- To grant admin access to an Ops/L&D user after they sign up:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'their@email.com';
-- ============================================================
