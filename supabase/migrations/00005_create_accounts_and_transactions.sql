CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit_card', 'cash', 'investment', 'other');

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type account_type NOT NULL DEFAULT 'checking',
  balance BIGINT NOT NULL DEFAULT 0,
  institution_name TEXT,
  plaid_account_id TEXT,
  plaid_item_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_user ON public.accounts(user_id);
CREATE INDEX idx_accounts_household ON public.accounts(household_id);

CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL DEFAULT 'expense',
  amount BIGINT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  payee TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_cleared BOOLEAN NOT NULL DEFAULT false,
  plaid_transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_household ON public.transactions(household_id);
CREATE INDEX idx_transactions_budget ON public.transactions(budget_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
