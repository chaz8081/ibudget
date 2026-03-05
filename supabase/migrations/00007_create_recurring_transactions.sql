-- Recurring/scheduled transactions
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    payee TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
    interval INTEGER NOT NULL DEFAULT 1,
    start_date TEXT NOT NULL,
    end_date TEXT,
    next_occurrence_date TEXT NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('expense', 'income')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_recurring_transactions_user ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_household ON public.recurring_transactions(household_id);
CREATE INDEX idx_recurring_transactions_next ON public.recurring_transactions(next_occurrence_date);

-- RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring transactions"
    ON public.recurring_transactions
    FOR ALL
    USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER set_recurring_transactions_updated_at
    BEFORE UPDATE ON public.recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add to publication for PowerSync
ALTER PUBLICATION powersync ADD TABLE public.recurring_transactions;
