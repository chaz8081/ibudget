-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.household_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.household_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.envelope_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- PowerSync publication
CREATE PUBLICATION powersync FOR TABLE
  public.profiles,
  public.households,
  public.household_members,
  public.household_invites,
  public.categories,
  public.budgets,
  public.envelope_allocations,
  public.accounts,
  public.transactions;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.get_user_household_ids()
RETURNS SETOF UUID AS $$
  SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can view household members profiles"
  ON public.profiles FOR SELECT
  USING (id IN (
    SELECT hm.user_id FROM public.household_members hm
    WHERE hm.household_id IN (SELECT public.get_user_household_ids())
  ));
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

-- HOUSEHOLDS policies
CREATE POLICY "Members can view household"
  ON public.households FOR SELECT
  USING (id IN (SELECT public.get_user_household_ids()));
CREATE POLICY "Authenticated users can create household"
  ON public.households FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can update household"
  ON public.households FOR UPDATE
  USING (owner_id = auth.uid());

-- HOUSEHOLD_MEMBERS policies
CREATE POLICY "Members can view household members"
  ON public.household_members FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));
CREATE POLICY "Owner or admin can insert members"
  ON public.household_members FOR INSERT
  WITH CHECK (household_id IN (
    SELECT hm.household_id FROM public.household_members hm
    WHERE hm.user_id = auth.uid() AND hm.role IN ('owner', 'admin')
  ));
CREATE POLICY "Users can join via valid invite"
  ON public.household_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT hi.household_id FROM public.household_invites hi
      WHERE hi.status = 'pending'
        AND (hi.invited_email = auth.email() OR hi.invited_email IS NULL)
        AND (hi.expires_at IS NULL OR hi.expires_at > now())
    )
  );

-- HOUSEHOLD_INVITES policies
CREATE POLICY "Members can view invites for their household"
  ON public.household_invites FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));
CREATE POLICY "Owner or admin can create invites"
  ON public.household_invites FOR INSERT
  WITH CHECK (invited_by = auth.uid());
CREATE POLICY "Invited user can update invite status"
  ON public.household_invites FOR UPDATE
  USING (invited_email = auth.email());

-- CATEGORIES policies
CREATE POLICY "Members can view categories"
  ON public.categories FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));
CREATE POLICY "Members can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (household_id IN (SELECT public.get_user_household_ids()));
CREATE POLICY "Members can update categories"
  ON public.categories FOR UPDATE
  USING (household_id IN (SELECT public.get_user_household_ids()));
CREATE POLICY "Members can delete categories"
  ON public.categories FOR DELETE
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- BUDGETS policies
CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can view household budgets"
  ON public.budgets FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));
CREATE POLICY "Users can create own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (user_id = auth.uid());

-- ENVELOPE_ALLOCATIONS policies
CREATE POLICY "Users can view allocations for accessible budgets"
  ON public.envelope_allocations FOR SELECT
  USING (budget_id IN (
    SELECT b.id FROM public.budgets b
    WHERE b.household_id IN (SELECT public.get_user_household_ids())
  ));
CREATE POLICY "Users can create allocations for own budgets"
  ON public.envelope_allocations FOR INSERT
  WITH CHECK (budget_id IN (
    SELECT b.id FROM public.budgets b WHERE b.user_id = auth.uid()
  ));
CREATE POLICY "Users can update allocations for own budgets"
  ON public.envelope_allocations FOR UPDATE
  USING (budget_id IN (
    SELECT b.id FROM public.budgets b WHERE b.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete allocations for own budgets"
  ON public.envelope_allocations FOR DELETE
  USING (budget_id IN (
    SELECT b.id FROM public.budgets b WHERE b.user_id = auth.uid()
  ));

-- ACCOUNTS policies
CREATE POLICY "Users can manage own accounts"
  ON public.accounts FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Household members can view accounts"
  ON public.accounts FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));

-- TRANSACTIONS policies
CREATE POLICY "Users can manage own transactions"
  ON public.transactions FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Household members can view transactions"
  ON public.transactions FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));
