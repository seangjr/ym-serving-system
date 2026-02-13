-- Migration: 00003_serving_teams
-- Creates serving_teams, team_positions, team_members, member_position_skills
-- All team/position data is ministry-agnostic (no Postgres enums for categories)

-- ---------------------------------------------------------------------------
-- 1. serving_teams
-- ---------------------------------------------------------------------------
create table public.serving_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  color text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. team_positions
-- ---------------------------------------------------------------------------
create table public.team_positions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.serving_teams(id) on delete cascade,
  name text not null,
  category text,
  quantity_needed int not null default 1,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(team_id, name)
);

-- ---------------------------------------------------------------------------
-- 3. team_members
-- ---------------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.serving_teams(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text not null default 'member' check (role in ('lead', 'member')),
  joined_at timestamptz not null default now(),
  unique(team_id, member_id)
);

-- ---------------------------------------------------------------------------
-- 4. member_position_skills
-- ---------------------------------------------------------------------------
create table public.member_position_skills (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  position_id uuid not null references public.team_positions(id) on delete cascade,
  proficiency text not null default 'beginner'
    check (proficiency in ('beginner', 'intermediate', 'advanced', 'expert')),
  preference text not null default 'willing'
    check (preference in ('primary', 'secondary', 'willing')),
  created_at timestamptz not null default now(),
  unique(member_id, position_id)
);

-- ---------------------------------------------------------------------------
-- 5. RLS policies — SELECT for authenticated on all four tables
-- ---------------------------------------------------------------------------
alter table public.serving_teams enable row level security;
create policy "Authenticated users can view teams"
  on public.serving_teams for select
  to authenticated
  using (true);

alter table public.team_positions enable row level security;
create policy "Authenticated users can view positions"
  on public.team_positions for select
  to authenticated
  using (true);

alter table public.team_members enable row level security;
create policy "Authenticated users can view team membership"
  on public.team_members for select
  to authenticated
  using (true);

alter table public.member_position_skills enable row level security;
create policy "Authenticated users can view skills"
  on public.member_position_skills for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 6. updated_at trigger for serving_teams
-- ---------------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_serving_teams_updated_at
  before update on public.serving_teams
  for each row
  execute function public.update_updated_at_column();
