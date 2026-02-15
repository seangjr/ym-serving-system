-- Migration: 00008_availability
-- Creates member_blackout_dates, member_recurring_unavailability tables
-- with RLS, indexes, constraints, and updated_at trigger

-- ---------------------------------------------------------------------------
-- 1. member_blackout_dates (one-time blackout dates / date ranges)
-- ---------------------------------------------------------------------------
create table public.member_blackout_dates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint blackout_date_order check (end_date >= start_date)
);

create index idx_blackout_member_dates
  on public.member_blackout_dates (member_id, start_date, end_date);

-- ---------------------------------------------------------------------------
-- 2. member_recurring_unavailability (recurring patterns)
-- ---------------------------------------------------------------------------
create table public.member_recurring_unavailability (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  frequency text not null
    check (frequency in ('weekly', 'biweekly', 'monthly', 'nth_weekday')),
  day_of_week int not null check (day_of_week between 0 and 6),
  nth_occurrence int check (nth_occurrence between 1 and 5),
  start_date date not null,
  end_date date,
  reason text,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recurring_member
  on public.member_recurring_unavailability (member_id);

-- ---------------------------------------------------------------------------
-- 3. RLS policies -- SELECT for authenticated on both tables
-- ---------------------------------------------------------------------------
alter table public.member_blackout_dates enable row level security;
create policy "Authenticated users can view blackout dates"
  on public.member_blackout_dates for select
  to authenticated
  using (true);

alter table public.member_recurring_unavailability enable row level security;
create policy "Authenticated users can view recurring unavailability"
  on public.member_recurring_unavailability for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger on member_recurring_unavailability
--    Reuses the existing update_updated_at_column() function from migration 00003
-- ---------------------------------------------------------------------------
create trigger set_recurring_unavailability_updated_at
  before update on public.member_recurring_unavailability
  for each row
  execute function public.update_updated_at_column();
