import { useCallback } from "react";
import { useQuery, usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { generateId } from "@/utils/uuid";
import { TRANSACTIONS_TABLE, BUDGETS_TABLE } from "@/db/tables";

export type TransactionRow = {
  id: string;
  user_id: string;
  household_id: string;
  budget_id: string | null;
  category_id: string | null;
  account_id: string | null;
  transaction_type: string;
  amount: number;
  description: string;
  payee: string | null;
  transaction_date: string;
  is_cleared: number;
  notes: string | null;
  created_at: string;
  // Joined fields
  category_name?: string;
  category_icon?: string;
};

type TransactionFilters = {
  householdId: string | null;
  budgetId?: string | null;
  categoryId?: string | null;
  transactionType?: string | null;
  limit?: number;
};

export function useTransactions(filters: TransactionFilters) {
  const db = usePowerSync();
  const { user } = useAuth();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.householdId) {
    conditions.push("t.household_id = ?");
    params.push(filters.householdId);
  }

  if (filters.budgetId) {
    conditions.push("t.budget_id = ?");
    params.push(filters.budgetId);
  }

  if (filters.categoryId) {
    conditions.push("t.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.transactionType) {
    conditions.push("t.transaction_type = ?");
    params.push(filters.transactionType);
  }

  // Only query own transactions by default
  if (user?.id) {
    conditions.push("t.user_id = ?");
    params.push(user.id);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitClause = filters.limit ? `LIMIT ${filters.limit}` : "LIMIT 100";

  const query = filters.householdId
    ? `SELECT t.*, c.name as category_name, c.icon as category_icon
       FROM ${TRANSACTIONS_TABLE} t
       LEFT JOIN categories c ON c.id = t.category_id
       ${whereClause}
       ORDER BY t.transaction_date DESC, t.created_at DESC
       ${limitClause}`
    : "SELECT 1 WHERE 0";

  const { data: transactions, isLoading } = useQuery<TransactionRow>(
    query,
    params
  );

  const addTransaction = useCallback(
    async (data: {
      description: string;
      payee?: string;
      amount: number;
      categoryId: string;
      transactionType: string;
      transactionDate: string;
      householdId: string;
      notes?: string;
    }) => {
      if (!user) return;
      const id = generateId();
      const now = new Date().toISOString();

      // Find budget for transaction date
      const dateParts = data.transactionDate.split("-");
      const txMonth = parseInt(dateParts[1], 10);
      const txYear = parseInt(dateParts[0], 10);

      const budgetRows = await db.getAll<{ id: string }>(
        `SELECT id FROM ${BUDGETS_TABLE} WHERE user_id = ? AND household_id = ? AND month = ? AND year = ?`,
        [user.id, data.householdId, txMonth, txYear]
      );
      const budgetId = budgetRows[0]?.id ?? null;

      await db.execute(
        `INSERT INTO ${TRANSACTIONS_TABLE}
         (id, user_id, household_id, budget_id, category_id, transaction_type, amount, description, payee, transaction_date, is_cleared, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          id,
          user.id,
          data.householdId,
          budgetId,
          data.categoryId,
          data.transactionType,
          data.amount,
          data.description,
          data.payee ?? null,
          data.transactionDate,
          data.notes ?? null,
          now,
          now,
        ]
      );
      return id;
    },
    [db, user]
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      data: Partial<{
        description: string;
        payee: string;
        amount: number;
        categoryId: string;
        transactionType: string;
        transactionDate: string;
        notes: string;
      }>
    ) => {
      if (!user) return;

      const sets: string[] = [];
      const params: (string | number | null)[] = [];

      if (data.description !== undefined) {
        sets.push("description = ?");
        params.push(data.description);
      }
      if (data.payee !== undefined) {
        sets.push("payee = ?");
        params.push(data.payee);
      }
      if (data.amount !== undefined) {
        sets.push("amount = ?");
        params.push(data.amount);
      }
      if (data.categoryId !== undefined) {
        sets.push("category_id = ?");
        params.push(data.categoryId);
      }
      if (data.transactionType !== undefined) {
        sets.push("transaction_type = ?");
        params.push(data.transactionType);
      }
      if (data.transactionDate !== undefined) {
        sets.push("transaction_date = ?");
        params.push(data.transactionDate);
      }
      if (data.notes !== undefined) {
        sets.push("notes = ?");
        params.push(data.notes);
      }

      if (sets.length === 0) return;

      sets.push("updated_at = ?");
      params.push(new Date().toISOString());
      params.push(id);
      params.push(user.id);

      await db.execute(
        `UPDATE ${TRANSACTIONS_TABLE} SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
        params
      );
    },
    [db, user]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      await db.execute(
        `DELETE FROM ${TRANSACTIONS_TABLE} WHERE id = ? AND user_id = ?`,
        [id, user.id]
      );
    },
    [db, user]
  );

  return {
    transactions: transactions ?? [],
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
