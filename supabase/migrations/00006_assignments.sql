-- Migration: 00006_assignments
-- Creates service_positions, service_assignments, schedule_templates tables
-- with RLS, indexes, and updated_at triggers

-- ---------------------------------------------------------------------------
-- 1. service_positions (per-service position slots)
--    Each row is a slot on a specific service for a specific team's position.
--    Multiples of the same position allowed (e.g., 2 Vocalists).
-- ---------------------------------------------------------------------------
create table public.service_positions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  team_id uuid not null references public.serving_teams(id) on delete cascade,
  position_id uuid not null references public.team_positions(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. service_assignments (member assigned to a position slot)
--    Status state machine: pending -> confirmed | declined
--    One member per slot (UNIQUE on service_position_id)
-- ---------------------------------------------------------------------------
create table public.service_assignments (
  id uuid primary key default gen_random_uuid(),
  service_position_id uuid not null references public.service_positions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'declined')),
  notes text,
  has_conflict boolean not null default false,
  assigned_by uuid references public.members(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_position_id)
);

-- ---------------------------------------------------------------------------
-- 3. schedule_templates (reusable position configurations)
--    Positions stored as JSON snapshot for resilience against position changes
-- ---------------------------------------------------------------------------
create table public.schedule_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  team_id uuid references public.serving_teams(id) on delete set null,
  positions jsonb not null default '[]',
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
create index idx_service_positions_service_team
  on public.service_positions (service_id, team_id);

create index idx_service_assignments_member
  on public.service_assignments (member_id);

-- ---------------------------------------------------------------------------
-- 5. RLS policies -- SELECT for authenticated on all three tables
-- ---------------------------------------------------------------------------
alter table public.service_positions enable row level security;
create policy "Authenticated users can view service positions"
  on public.service_positions for select
  to authenticated
  using (true);

alter table public.service_assignments enable row level security;
create policy "Authenticated users can view assignments"
  on public.service_assignments for select
  to authenticated
  using (true);

alter table public.schedule_templates enable row level security;
create policy "Authenticated users can view templates"
  on public.schedule_templates for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 6. updated_at triggers
--    Reuses the existing update_updated_at_column() function from migration 00003
-- ---------------------------------------------------------------------------
create trigger set_service_assignments_updated_at
  before update on public.service_assignments
  for each row
  execute function public.update_updated_at_column();

create trigger set_schedule_templates_updated_at
  before update on public.schedule_templates
  for each row
  execute function public.update_updated_at_column();
