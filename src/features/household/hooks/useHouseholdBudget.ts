import { useQuery } from "@powersync/react";

type HouseholdBudgetSummary = {
  total_income: number;
  total_allocated: number;
  total_spent: number;
  member_count: number;
};

type MemberBudgetRow = {
  user_id: string;
  display_name: string;
  total_income: number;
  total_allocated: number;
  total_spent: number;
};

type CategoryBreakdown = {
  category_id: string;
  category_name: string;
  category_icon: string | null;
  category_group: string;
  total_allocated: number;
  total_spent: number;
};

export function useHouseholdBudget(
  householdId: string | null,
  month: number,
  year: number
) {
  // Aggregate budget summary
  const { data: summaryData } = useQuery<HouseholdBudgetSummary>(
    householdId
      ? `SELECT
           COALESCE(SUM(b.total_income), 0) AS total_income,
           COALESCE((SELECT SUM(ea.allocated_amount) FROM envelope_allocations ea
                     JOIN budgets b2 ON ea.budget_id = b2.id
                     WHERE b2.household_id = ? AND b2.month = ? AND b2.year = ?), 0) AS total_allocated,
           COALESCE((SELECT SUM(t.amount) FROM transactions t
                     WHERE t.household_id = ? AND t.transaction_type = 'expense'
                     AND t.budget_id IN (SELECT id FROM budgets WHERE household_id = ? AND month = ? AND year = ?)), 0) AS total_spent,
           COUNT(DISTINCT b.user_id) AS member_count
         FROM budgets b
         WHERE b.household_id = ? AND b.month = ? AND b.year = ?`
      : "SELECT 1 WHERE 0",
    householdId
      ? [
          householdId, month, year,
          householdId, householdId, month, year,
          householdId, month, year,
        ]
      : []
  );

  // Per-member breakdown
  const { data: memberBudgets } = useQuery<MemberBudgetRow>(
    householdId
      ? `SELECT
           b.user_id,
           COALESCE(p.display_name, 'Unknown') AS display_name,
           b.total_income,
           COALESCE((SELECT SUM(ea.allocated_amount) FROM envelope_allocations ea WHERE ea.budget_id = b.id), 0) AS total_allocated,
           COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.budget_id = b.id AND t.transaction_type = 'expense'), 0) AS total_spent
         FROM budgets b
         LEFT JOIN profiles p ON p.id = b.user_id
         WHERE b.household_id = ? AND b.month = ? AND b.year = ?
         ORDER BY p.display_name`
      : "SELECT 1 WHERE 0",
    householdId ? [householdId, month, year] : []
  );

  // Per-category breakdown across all members
  const { data: categoryBreakdown } = useQuery<CategoryBreakdown>(
    householdId
      ? `SELECT
           c.id AS category_id,
           c.name AS category_name,
           c.icon AS category_icon,
           c.category_group,
           COALESCE(SUM(ea.allocated_amount), 0) AS total_allocated,
           COALESCE(t_sum.total_spent, 0) AS total_spent
         FROM categories c
         LEFT JOIN envelope_allocations ea ON ea.category_id = c.id
           AND ea.budget_id IN (SELECT id FROM budgets WHERE household_id = ? AND month = ? AND year = ?)
         LEFT JOIN (
           SELECT category_id, SUM(amount) AS total_spent
           FROM transactions
           WHERE household_id = ? AND transaction_type = 'expense'
             AND budget_id IN (SELECT id FROM budgets WHERE household_id = ? AND month = ? AND year = ?)
           GROUP BY category_id
         ) t_sum ON t_sum.category_id = c.id
         WHERE c.household_id = ? AND c.is_archived = 0
         GROUP BY c.id
         HAVING total_allocated > 0 OR total_spent > 0
         ORDER BY c.sort_order`
      : "SELECT 1 WHERE 0",
    householdId
      ? [
          householdId, month, year,
          householdId, householdId, month, year,
          householdId,
        ]
      : []
  );

  const summary = summaryData?.[0] ?? {
    total_income: 0,
    total_allocated: 0,
    total_spent: 0,
    member_count: 0,
  };

  return {
    summary,
    memberBudgets: memberBudgets ?? [],
    categoryBreakdown: categoryBreakdown ?? [],
  };
}
