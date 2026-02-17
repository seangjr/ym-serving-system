-- Migration: 00009_notifications
-- Creates notifications and swap_requests tables with RLS, indexes,
-- Realtime publication, and updated_at trigger

-- ---------------------------------------------------------------------------
-- 1. notifications table
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_member_id uuid not null
    references public.members(id) on delete cascade,
  type text not null
    check (type in (
      'assignment_new',
      'assignment_changed',
      'assignment_declined',
      'swap_requested',
      'swap_approved',
      'swap_rejected',
      'reminder'
    )),
  title text not null,
  body text not null,
  metadata jsonb not null default '{}',
  action_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. notifications indexes
-- ---------------------------------------------------------------------------
create index idx_notifications_unread
  on public.notifications (recipient_member_id, is_read, created_at desc);

create index idx_notifications_all
  on public.notifications (recipient_member_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. notifications RLS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (
    recipient_member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
  );

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (
    recipient_member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
  );

create policy "Users can delete own notifications"
  on public.notifications for delete
  to authenticated
  using (
    recipient_member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
  );

-- No INSERT policy for authenticated -- inserts done via admin client (server-side)

-- ---------------------------------------------------------------------------
-- 4. Realtime publication
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.notifications;
alter table public.notifications replica identity full;

-- ---------------------------------------------------------------------------
-- 5. swap_requests table (pre-arranged model)
-- ---------------------------------------------------------------------------
create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null
    references public.service_assignments(id) on delete cascade,
  requester_member_id uuid not null
    references public.members(id) on delete cascade,
  target_member_id uuid not null
    references public.members(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reason text,
  resolved_by uuid
    references public.members(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. swap_requests indexes
-- ---------------------------------------------------------------------------
create index idx_swap_requests_assignment
  on public.swap_requests (assignment_id);

create index idx_swap_requests_pending
  on public.swap_requests (status)
  where status = 'pending';

create unique index idx_swap_requests_one_pending_per_assignment
  on public.swap_requests (assignment_id, status)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- 7. swap_requests RLS
-- ---------------------------------------------------------------------------
alter table public.swap_requests enable row level security;

create policy "Users can view relevant swap requests"
  on public.swap_requests for select
  to authenticated
  using (
    -- Requester can see their own requests
    requester_member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
    or
    -- Target can see requests involving them
    target_member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
    or
    -- Team lead can see requests for assignments in their team
    exists (
      select 1
      from public.service_assignments sa
      join public.service_positions sp on sp.id = sa.service_position_id
      join public.team_members tm on tm.team_id = sp.team_id
      where sa.id = swap_requests.assignment_id
        and tm.member_id in (
          select id from public.members
          where auth_user_id = (select auth.uid())
        )
        and tm.role = 'lead'
    )
  );

-- No INSERT/UPDATE/DELETE for authenticated -- done via admin client

-- ---------------------------------------------------------------------------
-- 8. updated_at trigger for swap_requests
-- ---------------------------------------------------------------------------
create trigger set_swap_requests_updated_at
  before update on public.swap_requests
  for each row
  execute function public.update_updated_at_column();
