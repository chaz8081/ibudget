import { useCallback } from "react";
import { usePowerSync, useQuery } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RECURRING_TRANSACTIONS_TABLE } from "@/db/tables";
import { generateId } from "@/utils/uuid";
import type { Frequency } from "../utils/recurring-engine";

export type RecurringTransaction = {
  id: string;
  user_id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  payee: string | null;
  frequency: Frequency;
  interval: number;
  start_date: string;
  end_date: string | null;
  next_occurrence_date: string;
  is_enabled: number;
  transaction_type: string;
  notes: string | null;
  category_name?: string;
  category_icon?: string;
};

export function useRecurringTransactions(householdId: string | null) {
  const db = usePowerSync();
  const { user } = useAuth();

  const { data: recurringTransactions } = useQuery<RecurringTransaction>(
    user?.id && householdId
      ? `SELECT rt.*, c.name as category_name, c.icon as category_icon
         FROM ${RECURRING_TRANSACTIONS_TABLE} rt
         LEFT JOIN categories c ON c.id = rt.category_id
         WHERE rt.user_id = ? AND rt.household_id = ?
         ORDER BY rt.next_occurrence_date ASC`
      : "SELECT 1 WHERE 0",
    user?.id && householdId ? [user.id, householdId] : []
  );

  const addRecurring = useCallback(
    async (data: {
      householdId: string;
      categoryId: string;
      amount: number;
      description: string;
      payee?: string;
      frequency: Frequency;
      interval?: number;
      startDate: string;
      endDate?: string;
      transactionType: string;
      notes?: string;
    }) => {
      if (!user) return;
      const id = generateId();
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO ${RECURRING_TRANSACTIONS_TABLE}
         (id, user_id, household_id, category_id, amount, description, payee,
          frequency, interval, start_date, end_date, next_occurrence_date,
          is_enabled, transaction_type, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
        [
          id,
          user.id,
          data.householdId,
          data.categoryId,
          data.amount,
          data.description,
          data.payee ?? null,
          data.frequency,
          data.interval ?? 1,
          data.startDate,
          data.endDate ?? null,
          data.startDate, // next_occurrence_date starts at start_date
          data.transactionType,
          data.notes ?? null,
          now,
          now,
        ]
      );
    },
    [db, user]
  );

  const toggleEnabled = useCallback(
    async (id: string, enabled: boolean) => {
      await db.execute(
        `UPDATE ${RECURRING_TRANSACTIONS_TABLE} SET is_enabled = ?, updated_at = ? WHERE id = ?`,
        [enabled ? 1 : 0, new Date().toISOString(), id]
      );
    },
    [db]
  );

  const deleteRecurring = useCallback(
    async (id: string) => {
      await db.execute(
        `DELETE FROM ${RECURRING_TRANSACTIONS_TABLE} WHERE id = ?`,
        [id]
      );
    },
    [db]
  );

  return {
    recurringTransactions: recurringTransactions ?? [],
    addRecurring,
    toggleEnabled,
    deleteRecurring,
  };
}
