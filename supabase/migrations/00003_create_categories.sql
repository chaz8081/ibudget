CREATE TYPE category_group AS ENUM (
  'housing', 'transportation', 'food', 'utilities',
  'insurance', 'healthcare', 'savings', 'debt',
  'personal', 'entertainment', 'education', 'giving', 'other'
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  category_group category_group NOT NULL DEFAULT 'other',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_household ON public.categories(household_id);
