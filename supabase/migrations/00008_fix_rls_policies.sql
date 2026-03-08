-- Fix: Allow household owner to add themselves as first member
-- Without this, creating a household fails because the INSERT policy
-- on household_members requires existing owner/admin membership.
CREATE POLICY "Owner can add self to household"
  ON public.household_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT id FROM public.households WHERE owner_id = auth.uid()
    )
  );

-- Fix: Allow users to leave a household (delete own membership)
CREATE POLICY "Users can remove own membership"
  ON public.household_members FOR DELETE
  USING (user_id = auth.uid());

-- Fix: Allow household members to view each other's recurring transactions
-- (matches the pattern used for regular transactions)
CREATE POLICY "Household members can view recurring transactions"
  ON public.recurring_transactions FOR SELECT
  USING (household_id IN (SELECT public.get_user_household_ids()));
