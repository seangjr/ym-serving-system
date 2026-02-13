-- Migration: 00004_member_profiles
-- Creates member_profiles table, avatars storage bucket, and associated policies

-- ---------------------------------------------------------------------------
-- 1. member_profiles table
-- ---------------------------------------------------------------------------
create table public.member_profiles (
  member_id uuid primary key references public.members(id) on delete cascade,
  phone text,
  avatar_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  birthdate date,
  joined_serving_at timestamptz default now(),
  notify_email boolean not null default true,
  notify_assignment_changes boolean not null default true,
  reminder_days_before int not null default 2,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. RLS policies
-- ---------------------------------------------------------------------------
alter table public.member_profiles enable row level security;

create policy "Authenticated users can view profiles"
  on public.member_profiles for select
  to authenticated
  using (true);

create policy "Members can update own profile"
  on public.member_profiles for update
  to authenticated
  using (
    member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
  );

create policy "Members can insert own profile"
  on public.member_profiles for insert
  to authenticated
  with check (
    member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 3. updated_at trigger
-- ---------------------------------------------------------------------------
create trigger set_member_profiles_updated_at
  before update on public.member_profiles
  for each row
  execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. Supabase Storage — avatars bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Users can upload to their own folder (folder name = member.id)
create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (
      select m.id::text from public.members m
      where m.auth_user_id = (select auth.uid())
    )
  );

-- Avatar images are publicly accessible (public bucket)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- Users can update their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (
      select m.id::text from public.members m
      where m.auth_user_id = (select auth.uid())
    )
  );
