import { useCallback, useRef } from "react";
import { usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RECURRING_TRANSACTIONS_TABLE, TRANSACTIONS_TABLE, BUDGETS_TABLE } from "@/db/tables";
import { generateId } from "@/utils/uuid";
import { calculateNextOccurrence, isDue, type Frequency } from "../utils/recurring-engine";

type RecurringRow = {
  id: string;
  user_id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  payee: string | null;
  frequency: Frequency;
  interval: number;
  end_date: string | null;
  next_occurrence_date: string;
  transaction_type: string;
  notes: string | null;
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
      const { rows } = await db.execute(
        `SELECT * FROM ${RECURRING_TRANSACTIONS_TABLE}
         WHERE user_id = ? AND is_enabled = 1 AND next_occurrence_date <= ?`,
        [user.id, today]
      );

      for (const row of rows as unknown as RecurringRow[]) {
        // Check end_date
        if (row.end_date && row.next_occurrence_date > row.end_date) {
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

        const { rows: budgetRows } = await db.execute(
          `SELECT id FROM ${BUDGETS_TABLE} WHERE user_id = ? AND household_id = ? AND month = ? AND year = ?`,
          [user.id, row.household_id, occMonth, occYear]
        );

        const budgetId = (budgetRows as any)?.[0]?.id;
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
        const nextDate = calculateNextOccurrence(
          row.next_occurrence_date,
          row.frequency,
          row.interval
        );

        // If next date is past end_date, disable
        if (row.end_date && nextDate > row.end_date) {
          await db.execute(
            `UPDATE ${RECURRING_TRANSACTIONS_TABLE}
             SET next_occurrence_date = ?, is_enabled = 0, updated_at = ?
             WHERE id = ?`,
            [nextDate, now, row.id]
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
