import { useCallback, useRef } from "react";
import { usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RECURRING_TRANSACTIONS_TABLE, TRANSACTIONS_TABLE, BUDGETS_TABLE } from "@/db/tables";
import { generateId } from "@/utils/uuid";
import { type RecurrenceRule, calculateNextDate, dbColumnsToRule } from "../utils/recurrence-rule";

type RecurringRow = {
  id: string;
  user_id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  payee: string | null;
  frequency: string;
  interval: number;
  end_date: string | null;
  next_occurrence_date: string;
  transaction_type: string;
  notes: string | null;
  by_day_of_week: string | null;
  by_month_day: string | null;
  by_set_pos: number | null;
  end_type: string | null;
  end_count: number | null;
};

export function useProcessRecurring() {
  const db = usePowerSync();
  const { user } = useAuth();
  const hasProcessed = useRef(false);

  const processRecurring = useCallback(async () => {
    if (!user || hasProcessed.current) return;
    hasProcessed.current = true;

    try {
      const today = new Date().toISOString().split("T")[0];

      // Find all enabled recurring transactions that are due
      const rows = await db.getAll<RecurringRow>(
        `SELECT * FROM ${RECURRING_TRANSACTIONS_TABLE}
         WHERE user_id = ? AND is_enabled = 1 AND next_occurrence_date <= ?`,
        [user.id, today]
      );

      for (const row of rows) {
        const rule = dbColumnsToRule(row);

        // Check end_date
        if (rule.endType === "on_date" && rule.endDate && row.next_occurrence_date > rule.endDate) {
          // Past end date — disable
          await db.execute(
            `UPDATE ${RECURRING_TRANSACTIONS_TABLE} SET is_enabled = 0, updated_at = ? WHERE id = ?`,
            [new Date().toISOString(), row.id]
          );
          continue;
        }

        // Find the budget for this occurrence date's month
        const occDate = new Date(row.next_occurrence_date + "T00:00:00");
        const occMonth = occDate.getMonth() + 1;
        const occYear = occDate.getFullYear();

        const budgetRows = await db.getAll<{ id: string }>(
          `SELECT id FROM ${BUDGETS_TABLE} WHERE user_id = ? AND household_id = ? AND month = ? AND year = ?`,
          [user.id, row.household_id, occMonth, occYear]
        );

        const budgetId = budgetRows[0]?.id;
        if (!budgetId) {
          // No budget for this month yet — skip and let it generate next time
          continue;
        }

        // Create the transaction
        const txId = generateId();
        const now = new Date().toISOString();

        await db.execute(
          `INSERT INTO ${TRANSACTIONS_TABLE}
           (id, user_id, household_id, budget_id, category_id, transaction_type,
            amount, description, payee, transaction_date, is_cleared, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          [
            txId,
            user.id,
            row.household_id,
            budgetId,
            row.category_id,
            row.transaction_type,
            row.amount,
            row.description,
            row.payee,
            row.next_occurrence_date,
            row.notes,
            now,
            now,
          ]
        );

        // Advance next_occurrence_date
        const nextDate = calculateNextDate(row.next_occurrence_date, rule);

        // If no next date (end condition met), disable
        if (nextDate === null) {
          await db.execute(
            `UPDATE ${RECURRING_TRANSACTIONS_TABLE}
             SET is_enabled = 0, updated_at = ?
             WHERE id = ?`,
            [now, row.id]
          );
        } else {
          await db.execute(
            `UPDATE ${RECURRING_TRANSACTIONS_TABLE}
             SET next_occurrence_date = ?, updated_at = ?
             WHERE id = ?`,
            [nextDate, now, row.id]
          );
        }
      }
    } catch (error) {
      console.warn("Error processing recurring transactions:", error);
    }
  }, [db, user]);

  return { processRecurring };
}
