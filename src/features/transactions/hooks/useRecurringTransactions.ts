import { useCallback } from "react";
import { usePowerSync, useQuery } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RECURRING_TRANSACTIONS_TABLE } from "@/db/tables";
import { generateId } from "@/utils/uuid";
import { type RecurrenceRule, ruleToDbColumns, dbColumnsToRule, describeRecurrence } from "../utils/recurrence-rule";

export type RecurringTransaction = {
  id: string;
  user_id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  payee: string | null;
  frequency: string;
  interval: number;
  start_date: string;
  end_date: string | null;
  next_occurrence_date: string;
  is_enabled: number;
  transaction_type: string;
  notes: string | null;
  by_day_of_week: string | null;
  by_month_day: string | null;
  by_set_pos: number | null;
  end_type: string | null;
  end_count: number | null;
  category_name?: string;
  category_icon?: string;
  recurrenceRule?: RecurrenceRule;
  recurrenceDescription?: string;
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

  const enrichedRecurring = (recurringTransactions ?? []).map((rt) => {
    const rule = dbColumnsToRule(rt);
    return {
      ...rt,
      recurrenceRule: rule,
      recurrenceDescription: describeRecurrence(rule),
    };
  });

  const addRecurring = useCallback(
    async (data: {
      householdId: string;
      categoryId: string;
      amount: number;
      description: string;
      payee?: string;
      recurrenceRule: RecurrenceRule;
      startDate: string;
      transactionType: string;
      notes?: string;
    }) => {
      if (!user) return;
      const id = generateId();
      const now = new Date().toISOString();
      const cols = ruleToDbColumns(data.recurrenceRule);

      await db.execute(
        `INSERT INTO ${RECURRING_TRANSACTIONS_TABLE}
         (id, user_id, household_id, category_id, amount, description, payee,
          frequency, interval, start_date, end_date, next_occurrence_date,
          is_enabled, transaction_type, notes,
          by_day_of_week, by_month_day, by_set_pos, end_type, end_count,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          user.id,
          data.householdId,
          data.categoryId,
          data.amount,
          data.description,
          data.payee ?? null,
          cols.frequency,
          cols.interval,
          data.startDate,
          cols.end_date,
          data.startDate,
          data.transactionType,
          data.notes ?? null,
          cols.by_day_of_week,
          cols.by_month_day,
          cols.by_set_pos,
          cols.end_type,
          cols.end_count,
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
    recurringTransactions: enrichedRecurring,
    addRecurring,
    toggleEnabled,
    deleteRecurring,
  };
}
