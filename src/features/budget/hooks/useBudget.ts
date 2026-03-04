import { useCallback } from "react";
import { useQuery, usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { generateId } from "@/utils/uuid";
import { getCurrentBudgetMonth } from "@/utils/date";
import { BUDGETS_TABLE } from "@/db/tables";

type BudgetRow = {
  id: string;
  user_id: string;
  household_id: string;
  month: number;
  year: number;
  total_income: number;
  notes: string | null;
};

export function useBudget(month?: number, year?: number) {
  const db = usePowerSync();
  const { user } = useAuth();
  const current = getCurrentBudgetMonth();
  const m = month ?? current.month;
  const y = year ?? current.year;

  const { data: budgets, isLoading } = useQuery<BudgetRow>(
    `SELECT * FROM ${BUDGETS_TABLE} WHERE user_id = ? AND month = ? AND year = ? LIMIT 1`,
    [user?.id ?? "", m, y]
  );

  const budget = budgets?.[0] ?? null;

  const getOrCreateBudget = useCallback(
    async (householdId: string): Promise<string> => {
      if (budget) return budget.id;

      const id = generateId();
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO ${BUDGETS_TABLE} (id, user_id, household_id, month, year, total_income, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [id, user?.id ?? "", householdId, m, y, now, now]
      );
      return id;
    },
    [db, user?.id, m, y, budget]
  );

  const updateIncome = useCallback(
    async (totalIncome: number) => {
      if (!budget) return;
      await db.execute(
        `UPDATE ${BUDGETS_TABLE} SET total_income = ?, updated_at = ? WHERE id = ?`,
        [totalIncome, new Date().toISOString(), budget.id]
      );
    },
    [db, budget]
  );

  return {
    budget,
    isLoading,
    getOrCreateBudget,
    updateIncome,
    month: m,
    year: y,
  };
}
