-- Migration: 00007_template_redesign
-- 1. Update service_types to: Sunday Service, Thursday Prayer Meeting, Special Events
-- 2. Alter schedule_templates: drop team_id, add service_type_id (whole-service templates)

-- ---------------------------------------------------------------------------
-- 1. Service type updates
-- ---------------------------------------------------------------------------

-- Rename sunday-morning → sunday-service
UPDATE public.service_types
  SET name = 'sunday-service', label = 'Sunday Service', color = '#6366f1', sort_order = 1
  WHERE name = 'sunday-morning';

-- Move any services/recurrence patterns from sunday-evening → sunday-service
UPDATE public.services
  SET service_type_id = (SELECT id FROM public.service_types WHERE name = 'sunday-service')
  WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = 'sunday-evening');

UPDATE public.service_recurrence_patterns
  SET service_type_id = (SELECT id FROM public.service_types WHERE name = 'sunday-service')
  WHERE service_type_id = (SELECT id FROM public.service_types WHERE name = 'sunday-evening');

DELETE FROM public.service_types WHERE name = 'sunday-evening';

-- Rename wednesday → thursday-prayer
UPDATE public.service_types
  SET name = 'thursday-prayer', label = 'Thursday Prayer Meeting', color = '#22c55e', sort_order = 2
  WHERE name = 'wednesday';

-- Rename special-event → special-events
UPDATE public.service_types
  SET name = 'special-events', label = 'Special Events', color = '#f59e0b', sort_order = 3
  WHERE name = 'special-event';

-- ---------------------------------------------------------------------------
-- 2. Alter schedule_templates for whole-service templates
-- ---------------------------------------------------------------------------

-- Clear any existing templates (none saved successfully during dev)
TRUNCATE public.schedule_templates;

-- Drop per-team column, add service type link
ALTER TABLE public.schedule_templates DROP COLUMN IF EXISTS team_id;
ALTER TABLE public.schedule_templates
  ADD COLUMN service_type_id uuid REFERENCES public.service_types(id) ON DELETE SET NULL;

-- positions jsonb column already exists — application code will write new format:
-- [{ teamId, teamName, positionId, positionName, category, sortOrder, memberId?, memberName? }]
