-- Migration: 00010_reminder_cron
-- Creates the generate_service_reminders() function and schedules a daily
-- pg_cron job at 8 AM UTC.  The cron schedule is wrapped in a DO block so the
-- migration succeeds even when pg_cron is not available (local dev, hobby
-- Supabase plans).  The companion API route (/api/reminders) provides a
-- fallback trigger.

-- ---------------------------------------------------------------------------
-- 1. Enable pg_cron extension (no-op if already enabled)
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema extensions;

-- ---------------------------------------------------------------------------
-- 2. generate_service_reminders() function
--    Inserts 'reminder' notifications for members whose configured
--    reminder_days_before matches an upcoming service assignment.
--    Skips declined assignments, cancelled services, and already-sent
--    reminders (duplicate prevention via NOT EXISTS).
--    Returns the number of reminder rows inserted.
-- ---------------------------------------------------------------------------
create or replace function public.generate_service_reminders()
returns integer
language plpgsql
security definer
as $$
declare
  row_count integer;
begin
  insert into public.notifications (
    recipient_member_id,
    type,
    title,
    body,
    metadata,
    action_url
  )
  select
    sa.member_id,
    'reminder',
    'Serving Reminder',
    'You are serving as ' || tp.name || ' at ' || s.title
      || ' on ' || to_char(s.service_date, 'DD Mon YYYY'),
    jsonb_build_object('service_id', s.id, 'assignment_id', sa.id),
    '/my-schedule'
  from public.service_assignments sa
    join public.service_positions sp on sp.id = sa.service_position_id
    join public.services s          on s.id  = sp.service_id
    join public.team_positions tp   on tp.id = sp.position_id
    join public.member_profiles mp  on mp.member_id = sa.member_id
  where sa.status != 'declined'
    and s.is_cancelled = false
    and mp.reminder_days_before > 0
    and s.service_date = current_date + (mp.reminder_days_before || ' days')::interval
    and not exists (
      select 1
      from public.notifications n
      where n.recipient_member_id = sa.member_id
        and n.type = 'reminder'
        and n.metadata ->> 'assignment_id' = sa.id::text
    );

  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Permissions
-- ---------------------------------------------------------------------------
grant execute on function public.generate_service_reminders() to authenticated;
grant execute on function public.generate_service_reminders() to service_role;

-- ---------------------------------------------------------------------------
-- 4. Schedule pg_cron job (daily at 8:00 AM UTC)
--    Wrapped in exception handler so the migration succeeds if pg_cron is not
--    installed or the current user lacks privileges.
-- ---------------------------------------------------------------------------
do $$
begin
  perform cron.schedule(
    'daily-service-reminders',
    '0 8 * * *',
    'select public.generate_service_reminders()'
  );
exception when undefined_function or insufficient_privilege then
  raise notice 'pg_cron not available -- skipping cron schedule. Use the /api/reminders route instead.';
end;
$$;
