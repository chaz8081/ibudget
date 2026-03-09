-- Fix schema drift: add recurrence columns that exist in PowerSync client
-- schema (src/db/schema.ts) but were missing from the Supabase migration.
-- These support iCalendar-like recurrence rules (by_day_of_week, by_month_day,
-- by_set_pos) and flexible end conditions (end_type, end_count).

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS by_day_of_week TEXT,
  ADD COLUMN IF NOT EXISTS by_month_day TEXT,
  ADD COLUMN IF NOT EXISTS by_set_pos INTEGER,
  ADD COLUMN IF NOT EXISTS end_type TEXT DEFAULT 'never',
  ADD COLUMN IF NOT EXISTS end_count INTEGER;
