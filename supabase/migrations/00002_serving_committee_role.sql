-- Add "Committee" role for YM Serving system (serving team leads)
-- This role is used alongside the existing "Admin" and "Member" roles
-- Run this in Supabase SQL Editor
INSERT INTO public.roles (id, name)
VALUES (gen_random_uuid(), 'Committee')
ON CONFLICT (name) DO NOTHING;
