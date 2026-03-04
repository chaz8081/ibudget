import { useCallback } from "react";
import { useQuery, usePowerSync } from "@powersync/react";
import { generateId } from "@/utils/uuid";
import { CATEGORIES_TABLE } from "@/db/tables";
import { DEFAULT_CATEGORIES } from "../schemas/envelope.schema";

type CategoryRow = {
  id: string;
  household_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  category_group: string;
  sort_order: number;
  is_archived: number;
};

export function useCategories(householdId: string | null) {
  const db = usePowerSync();

  const { data: categories, isLoading } = useQuery<CategoryRow>(
    householdId
      ? `SELECT * FROM ${CATEGORIES_TABLE} WHERE household_id = ? AND is_archived = 0 ORDER BY sort_order, name`
      : "SELECT 1 WHERE 0",
    householdId ? [householdId] : []
  );

  const addCategory = useCallback(
    async (
      name: string,
      categoryGroup: string,
      icon?: string,
      color?: string
    ) => {
      if (!householdId) return;
      const id = generateId();
      const now = new Date().toISOString();
      const maxSort = (categories ?? []).reduce(
        (max, c) => Math.max(max, c.sort_order),
        0
      );

      await db.execute(
        `INSERT INTO ${CATEGORIES_TABLE} (id, household_id, name, icon, color, category_group, sort_order, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [id, householdId, name, icon ?? null, color ?? null, categoryGroup, maxSort + 1, now, now]
      );
      return id;
    },
    [db, householdId, categories]
  );

  const seedDefaultCategories = useCallback(
    async () => {
      if (!householdId) return;

      // Check if categories already exist
      const existing = await db.getAll<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${CATEGORIES_TABLE} WHERE household_id = ?`,
        [householdId]
      );
      if (existing[0]?.count > 0) return;

      const now = new Date().toISOString();
      await db.writeTransaction(async (tx) => {
        for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
          const cat = DEFAULT_CATEGORIES[i];
          const id = generateId();
          await tx.execute(
            `INSERT INTO ${CATEGORIES_TABLE} (id, household_id, name, icon, color, category_group, sort_order, is_archived, created_at, updated_at)
             VALUES (?, ?, ?, ?, NULL, ?, ?, 0, ?, ?)`,
            [id, householdId, cat.name, cat.icon, cat.group, i, now, now]
          );
        }
      });
    },
    [db, householdId]
  );

  const archiveCategory = useCallback(
    async (categoryId: string) => {
      if (!householdId) return;
      await db.execute(
        `UPDATE ${CATEGORIES_TABLE} SET is_archived = 1, updated_at = ? WHERE id = ? AND household_id = ?`,
        [new Date().toISOString(), categoryId, householdId]
      );
    },
    [db, householdId]
  );

  return {
    categories: categories ?? [],
    isLoading,
    addCategory,
    seedDefaultCategories,
    archiveCategory,
  };
}
