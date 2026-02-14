-- Migration: 00005_services
-- Creates service_types, services, service_recurrence_patterns tables
-- with RLS, indexes, seed data, and updated_at trigger

-- ---------------------------------------------------------------------------
-- 1. service_types (SERV-08: configurable service types)
-- ---------------------------------------------------------------------------
create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  color text not null default '#6366f1',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed default service types
insert into public.service_types (name, label, color, sort_order) values
  ('sunday-morning', 'Sunday Morning', '#6366f1', 1),
  ('sunday-evening', 'Sunday Evening', '#8b5cf6', 2),
  ('wednesday', 'Wednesday', '#22c55e', 3),
  ('special-event', 'Special Event', '#f59e0b', 4);

-- ---------------------------------------------------------------------------
-- 2. service_recurrence_patterns (SERV-05)
--    Created before services so the FK can reference it
-- ---------------------------------------------------------------------------
create table public.service_recurrence_patterns (
  id uuid primary key default gen_random_uuid(),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  day_of_week int check (day_of_week between 0 and 6),
  service_type_id uuid references public.service_types(id) on delete set null,
  start_date date not null,
  end_date date not null,
  start_time time not null,
  end_time time,
  duration_minutes int,
  title_template text,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. services (SERV-01, SERV-06)
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  service_date date not null,
  start_time time not null,
  end_time time,
  duration_minutes int,
  service_type_id uuid references public.service_types(id) on delete set null,
  rehearsal_date date,
  rehearsal_time time,
  rehearsal_notes text,
  notes text,
  recurrence_pattern_id uuid references public.service_recurrence_patterns(id) on delete set null,
  is_cancelled boolean not null default false,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
create index idx_services_date on public.services (service_date);
create index idx_services_type on public.services (service_type_id);

-- ---------------------------------------------------------------------------
-- 5. RLS policies — SELECT for authenticated on all three tables
-- ---------------------------------------------------------------------------
alter table public.service_types enable row level security;
create policy "Authenticated users can view service types"
  on public.service_types for select
  to authenticated
  using (true);

alter table public.services enable row level security;
create policy "Authenticated users can view services"
  on public.services for select
  to authenticated
  using (true);

alter table public.service_recurrence_patterns enable row level security;
create policy "Authenticated users can view recurrence patterns"
  on public.service_recurrence_patterns for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 6. updated_at trigger on services table
--    Reuses the existing update_updated_at_column() function from migration 00003
-- ---------------------------------------------------------------------------
create trigger set_services_updated_at
  before update on public.services
  for each row
  execute function public.update_updated_at_column();
