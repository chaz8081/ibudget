import { useCallback } from "react";
import { useQuery, usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { generateId } from "@/utils/uuid";
import type { EnvelopeWithBalance } from "../utils/budget-calculations";

export function useEnvelopes(budgetId: string | null, householdId: string | null) {
  const db = usePowerSync();
  const { user } = useAuth();

  const { data: envelopes, isLoading } = useQuery<EnvelopeWithBalance>(
    budgetId && householdId
      ? `SELECT
           c.id,
           c.name,
           c.icon,
           c.color,
           c.category_group,
           COALESCE(ea.allocated_amount, 0) AS allocated,
           COALESCE(t_sum.total_spent, 0) AS spent,
           COALESCE(ea.allocated_amount, 0) - COALESCE(t_sum.total_spent, 0) AS remaining
         FROM categories c
         LEFT JOIN envelope_allocations ea
           ON ea.category_id = c.id AND ea.budget_id = ?
         LEFT JOIN (
           SELECT category_id, SUM(amount) AS total_spent
           FROM transactions
           WHERE budget_id = ? AND transaction_type = 'expense'
           GROUP BY category_id
         ) t_sum ON t_sum.category_id = c.id
         WHERE c.household_id = ? AND c.is_archived = 0
         ORDER BY c.sort_order, c.name`
      : "SELECT 1 WHERE 0",
    budgetId && householdId ? [budgetId, budgetId, householdId] : []
  );

  const updateAllocation = useCallback(
    async (categoryId: string, amount: number) => {
      if (!budgetId || !user) return;

      const now = new Date().toISOString();

      // Verify budget belongs to current user
      const budgetOwner = await db.getAll<{ id: string }>(
        `SELECT id FROM budgets WHERE id = ? AND user_id = ?`,
        [budgetId, user.id]
      );
      if (budgetOwner.length === 0) return;

      // Check if allocation exists
      const existing = await db.getAll<{ id: string }>(
        `SELECT id FROM envelope_allocations WHERE budget_id = ? AND category_id = ?`,
        [budgetId, categoryId]
      );

      if (existing.length > 0) {
        await db.execute(
          `UPDATE envelope_allocations SET allocated_amount = ?, updated_at = ? WHERE id = ?`,
          [amount, now, existing[0].id]
        );
      } else {
        const id = generateId();
        await db.execute(
          `INSERT INTO envelope_allocations (id, budget_id, category_id, allocated_amount, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, budgetId, categoryId, amount, now, now]
        );
      }
    },
    [db, budgetId, user]
  );

  return {
    envelopes: envelopes ?? [],
    isLoading,
    updateAllocation,
  };
}
