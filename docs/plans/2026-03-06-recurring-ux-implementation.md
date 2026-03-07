# Recurring UX Redesign + Category Multiselect Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the rigid 4-option recurring frequency picker with a Google Calendar-style recurrence builder (presets + custom modal), and convert the category filter to multiselect with count badge display.

**Architecture:** Create a `RecurrenceRule` type that replaces `Frequency`, with a `recurrence-rule.ts` utility module for type definitions, next-occurrence calculation, and human-readable descriptions. The UI uses progressive disclosure: smart presets first, "Custom..." opens a full builder modal. The CategoryPicker gains a `multiSelect` mode for the transaction filter.

**Tech Stack:** React Native, Expo Router, NativeWind v4, react-hook-form, zod, PowerSync, date-fns

**Worktree:** Create a new worktree for branch `feature/recurring-ux-redesign`

---

### Task 1: Create RecurrenceRule type and describeRecurrence utility (recurrence-rule.ts)

**Files:**
- Create: `src/features/transactions/utils/recurrence-rule.ts`

**Context:** This is the core data model. `RecurrenceRule` replaces the old `Frequency` type. The `describeRecurrence` function produces human-readable summaries like "Every 2 weeks on Mon, Wed" or "Monthly on the third Tuesday, ends after 12 occurrences". This file has no UI dependencies — it's pure logic.

**Step 1: Create the RecurrenceRule type and describeRecurrence function**

```tsx
// src/features/transactions/utils/recurrence-rule.ts
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getDay,
  getDate,
  setDate,
  format,
} from "date-fns";

export type RecurrenceRule = {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byDayOfWeek?: number[];    // 0=Sun..6=Sat
  byMonthDay?: number[];     // 1-31
  bySetPos?: number;         // -1=last, 1=first, 2=second, 3=third, 4=fourth
  endType: "never" | "on_date" | "after_count";
  endDate?: string;
  endCount?: number;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINALS = ["", "first", "second", "third", "fourth"];

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function describeRecurrence(rule: RecurrenceRule): string {
  const { frequency, interval, byDayOfWeek, byMonthDay, bySetPos, endType, endDate, endCount } = rule;

  let base = "";

  // Frequency + interval
  if (interval === 1) {
    switch (frequency) {
      case "daily": base = "Every day"; break;
      case "weekly": base = "Every week"; break;
      case "monthly": base = "Every month"; break;
      case "yearly": base = "Every year"; break;
    }
  } else {
    const units: Record<string, string> = { daily: "days", weekly: "weeks", monthly: "months", yearly: "years" };
    base = `Every ${interval} ${units[frequency]}`;
  }

  // Day-of-week (weekly)
  if (frequency === "weekly" && byDayOfWeek && byDayOfWeek.length > 0) {
    const dayStr = byDayOfWeek.map((d) => DAY_NAMES[d]).join(", ");
    base += ` on ${dayStr}`;
  }

  // Monthly specifics
  if (frequency === "monthly") {
    if (bySetPos != null && byDayOfWeek && byDayOfWeek.length === 1) {
      const pos = bySetPos === -1 ? "last" : ORDINALS[bySetPos] ?? `${bySetPos}th`;
      base += ` on the ${pos} ${DAY_NAMES_FULL[byDayOfWeek[0]]}`;
    } else if (byMonthDay && byMonthDay.length > 0) {
      const dayStr = byMonthDay.map(ordinalSuffix).join(" and ");
      base += ` on the ${dayStr}`;
    }
  }

  // Yearly — include the month name if we have a start date context
  // (handled at call site by appending "on [month day]")

  // End condition
  if (endType === "on_date" && endDate) {
    base += `, until ${endDate}`;
  } else if (endType === "after_count" && endCount) {
    base += `, ${endCount} time${endCount === 1 ? "" : "s"}`;
  }

  return base;
}

/**
 * Generate smart preset rules from a transaction date.
 */
export function generatePresets(dateStr: string): { label: string; rule: RecurrenceRule }[] {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = getDay(date);       // 0-6
  const dayOfMonth = getDate(date);     // 1-31
  const monthName = format(date, "MMMM");
  const dayName = DAY_NAMES_FULL[dayOfWeek];

  return [
    {
      label: `Every week on ${dayName}`,
      rule: { frequency: "weekly", interval: 1, byDayOfWeek: [dayOfWeek], endType: "never" },
    },
    {
      label: `Every 2 weeks on ${dayName}`,
      rule: { frequency: "weekly", interval: 2, byDayOfWeek: [dayOfWeek], endType: "never" },
    },
    {
      label: `Every month on the ${ordinalSuffix(dayOfMonth)}`,
      rule: { frequency: "monthly", interval: 1, byMonthDay: [dayOfMonth], endType: "never" },
    },
    {
      label: `Every year on ${monthName} ${dayOfMonth}`,
      rule: { frequency: "yearly", interval: 1, endType: "never" },
    },
  ];
}

/**
 * Calculate the next occurrence date from a RecurrenceRule.
 * Returns null if the recurrence has ended.
 */
export function calculateNextDate(
  currentDateStr: string,
  rule: RecurrenceRule,
  occurrenceCount?: number
): string | null {
  // Check end conditions
  if (rule.endType === "after_count" && rule.endCount != null && occurrenceCount != null) {
    if (occurrenceCount >= rule.endCount) return null;
  }

  const current = new Date(currentDateStr + "T00:00:00");
  let next: Date;

  switch (rule.frequency) {
    case "daily":
      next = addDays(current, rule.interval);
      break;

    case "weekly":
      if (rule.byDayOfWeek && rule.byDayOfWeek.length > 0) {
        // Find the next matching day of week
        next = findNextMatchingDayOfWeek(current, rule.byDayOfWeek, rule.interval);
      } else {
        next = addWeeks(current, rule.interval);
      }
      break;

    case "monthly":
      if (rule.bySetPos != null && rule.byDayOfWeek && rule.byDayOfWeek.length === 1) {
        // Ordinal weekday: e.g. "third Tuesday"
        next = findNthWeekdayOfMonth(current, rule.byDayOfWeek[0], rule.bySetPos, rule.interval);
      } else if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        // Specific day of month
        next = findNextMonthDay(current, rule.byMonthDay, rule.interval);
      } else {
        next = addMonths(current, rule.interval);
      }
      break;

    case "yearly":
      next = addYears(current, rule.interval);
      break;

    default:
      next = addMonths(current, rule.interval);
  }

  const nextStr = next.toISOString().split("T")[0];

  // Check end date
  if (rule.endType === "on_date" && rule.endDate && nextStr > rule.endDate) {
    return null;
  }

  return nextStr;
}

function findNextMatchingDayOfWeek(current: Date, days: number[], weekInterval: number): Date {
  const sorted = [...days].sort((a, b) => a - b);
  const currentDay = getDay(current);

  // Look for the next matching day in the same week
  for (const d of sorted) {
    if (d > currentDay) {
      return addDays(current, d - currentDay);
    }
  }

  // No more days this week — jump to first matching day of next interval
  const daysUntilEndOfWeek = 6 - currentDay;
  const startOfNextWeek = addDays(current, daysUntilEndOfWeek + 1 + (weekInterval - 1) * 7);
  const nextWeekDay = getDay(startOfNextWeek); // Should be Sunday (0)
  return addDays(startOfNextWeek, sorted[0] - nextWeekDay);
}

function findNthWeekdayOfMonth(current: Date, targetDay: number, setPos: number, monthInterval: number): Date {
  const nextMonth = addMonths(current, monthInterval);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth();

  if (setPos === -1) {
    // Last occurrence of targetDay in month
    const lastDay = new Date(year, month + 1, 0); // last day of month
    let d = lastDay;
    while (getDay(d) !== targetDay) {
      d = addDays(d, -1);
    }
    return d;
  }

  // Find the Nth occurrence of targetDay
  let first = new Date(year, month, 1);
  while (getDay(first) !== targetDay) {
    first = addDays(first, 1);
  }
  return addDays(first, (setPos - 1) * 7);
}

function findNextMonthDay(current: Date, monthDays: number[], monthInterval: number): Date {
  const sorted = [...monthDays].sort((a, b) => a - b);
  const currentDayOfMonth = getDate(current);

  // Check if there's a later matching day in the current month
  for (const d of sorted) {
    if (d > currentDayOfMonth) {
      const candidate = setDate(current, d);
      // Ensure the day exists in this month (e.g. Feb 30 → skip)
      if (getDate(candidate) === d) return candidate;
    }
  }

  // Next interval month, first matching day
  const nextMonth = addMonths(current, monthInterval);
  for (const d of sorted) {
    const candidate = setDate(nextMonth, d);
    if (getDate(candidate) === d) return candidate;
  }

  // Fallback — just advance by interval
  return addMonths(current, monthInterval);
}

/**
 * Serialize a RecurrenceRule to DB columns.
 */
export function ruleToDbColumns(rule: RecurrenceRule) {
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    by_day_of_week: rule.byDayOfWeek ? JSON.stringify(rule.byDayOfWeek) : null,
    by_month_day: rule.byMonthDay ? JSON.stringify(rule.byMonthDay) : null,
    by_set_pos: rule.bySetPos ?? null,
    end_type: rule.endType,
    end_date: rule.endDate ?? null,
    end_count: rule.endCount ?? null,
  };
}

/**
 * Deserialize DB columns to a RecurrenceRule.
 */
export function dbColumnsToRule(row: {
  frequency: string;
  interval: number;
  by_day_of_week: string | null;
  by_month_day: string | null;
  by_set_pos: number | null;
  end_type: string | null;
  end_date: string | null;
  end_count: number | null;
}): RecurrenceRule {
  return {
    frequency: row.frequency as RecurrenceRule["frequency"],
    interval: row.interval || 1,
    byDayOfWeek: row.by_day_of_week ? JSON.parse(row.by_day_of_week) : undefined,
    byMonthDay: row.by_month_day ? JSON.parse(row.by_month_day) : undefined,
    bySetPos: row.by_set_pos ?? undefined,
    endType: (row.end_type as RecurrenceRule["endType"]) ?? "never",
    endDate: row.end_date ?? undefined,
    endCount: row.end_count ?? undefined,
  };
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`
Expected: No errors from our file

**Step 3: Commit**

```bash
git add src/features/transactions/utils/recurrence-rule.ts
git commit -m "Add RecurrenceRule type with describe, presets, and next-date calculator"
```

---

### Task 2: Add new columns to PowerSync schema

**Files:**
- Modify: `src/db/schema.ts`

**Context:** The `recurring_transactions` table needs 5 new columns for the expanded recurrence model. PowerSync uses `TableV2` with `column.text` and `column.integer`. Since PowerSync uses local SQLite, adding columns to the schema definition is all that's needed — PowerSync handles the migration automatically.

**Step 1: Add new columns to recurring_transactions**

In `src/db/schema.ts`, update the `recurring_transactions` table definition (line 133-159). Add these columns after `notes`:

```tsx
    by_day_of_week: column.text,    // JSON array: [0,1,5] for Sun,Mon,Fri
    by_month_day: column.text,      // JSON array: [1,15] for 1st and 15th
    by_set_pos: column.integer,     // ordinal: -1=last, 1-4=first-fourth
    end_type: column.text,          // "never" | "on_date" | "after_count"
    end_count: column.integer,      // occurrences count for after_count
```

These go after `notes: column.text,` and before `created_at: column.text,`.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`
Expected: No errors

**Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "Add recurrence rule columns to recurring_transactions schema"
```

---

### Task 3: Update useRecurringTransactions hook for RecurrenceRule

**Files:**
- Modify: `src/features/transactions/hooks/useRecurringTransactions.ts`

**Context:** The hook currently uses `Frequency` type and simple columns. Update it to use `RecurrenceRule`, import the serialization helpers, and update the `addRecurring` function to write the new columns. The `RecurringTransaction` type needs the new fields. The SELECT query needs to fetch the new columns.

**Step 1: Update imports and types**

Replace the import of `Frequency` (line 6):
```tsx
import { type RecurrenceRule, ruleToDbColumns, dbColumnsToRule, describeRecurrence } from "../utils/recurrence-rule";
```

Update the `RecurringTransaction` type (lines 8-26) — replace `frequency: Frequency` and add new fields:
```tsx
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
  // Computed at read time:
  recurrenceRule?: RecurrenceRule;
  recurrenceDescription?: string;
};
```

**Step 2: Update the query and post-process results**

Update the SELECT to include new columns (line 34):
```tsx
    user?.id && householdId
      ? `SELECT rt.*, c.name as category_name, c.icon as category_icon
         FROM ${RECURRING_TRANSACTIONS_TABLE} rt
         LEFT JOIN categories c ON c.id = rt.category_id
         WHERE rt.user_id = ? AND rt.household_id = ?
         ORDER BY rt.next_occurrence_date ASC`
      : "SELECT 1 WHERE 0",
```

The query is the same (SELECT *), but add post-processing. After the `useQuery` call, map the results:

```tsx
  const enrichedRecurring = (recurringTransactions ?? []).map((rt) => {
    const rule = dbColumnsToRule(rt);
    return {
      ...rt,
      recurrenceRule: rule,
      recurrenceDescription: describeRecurrence(rule),
    };
  });
```

Return `enrichedRecurring` instead of `recurringTransactions ?? []`.

**Step 3: Update addRecurring to accept RecurrenceRule**

Change the `addRecurring` data parameter — replace `frequency: Frequency` with `recurrenceRule: RecurrenceRule`:

```tsx
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
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`
Expected: May show errors in files that call `addRecurring` — those are fixed in later tasks

**Step 5: Commit**

```bash
git add src/features/transactions/hooks/useRecurringTransactions.ts
git commit -m "Update useRecurringTransactions to use RecurrenceRule"
```

---

### Task 4: Update useProcessRecurring to use RecurrenceRule

**Files:**
- Modify: `src/features/transactions/hooks/useProcessRecurring.ts`

**Context:** This hook processes due recurring transactions — creates actual transaction records and advances `next_occurrence_date`. Update it to use `calculateNextDate` from `recurrence-rule.ts` and read the new DB columns.

**Step 1: Update imports**

Replace line 6:
```tsx
import { type RecurrenceRule, calculateNextDate, dbColumnsToRule } from "../utils/recurrence-rule";
```

Remove the old import of `calculateNextOccurrence, isDue, type Frequency`.

**Step 2: Update RecurringRow type**

Add new fields to `RecurringRow` (lines 8-22):
```tsx
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
```

**Step 3: Update the processing logic**

In the `for` loop (line 43), replace the end_date check and next-date calculation:

```tsx
      for (const row of rows as unknown as RecurringRow[]) {
        const rule = dbColumnsToRule(row);

        // Check if past end_date
        if (rule.endType === "on_date" && rule.endDate && row.next_occurrence_date > rule.endDate) {
          await db.execute(
            `UPDATE ${RECURRING_TRANSACTIONS_TABLE} SET is_enabled = 0, updated_at = ? WHERE id = ?`,
            [new Date().toISOString(), row.id]
          );
          continue;
        }

        // ... (budget lookup and transaction creation stays the same) ...

        // Advance next_occurrence_date
        const nextDate = calculateNextDate(row.next_occurrence_date, rule);

        if (nextDate === null) {
          // Recurrence has ended
          await db.execute(
            `UPDATE ${RECURRING_TRANSACTIONS_TABLE}
             SET is_enabled = 0, updated_at = ?
             WHERE id = ?`,
            [new Date().toISOString(), row.id]
          );
        } else {
          await db.execute(
            `UPDATE ${RECURRING_TRANSACTIONS_TABLE}
             SET next_occurrence_date = ?, updated_at = ?
             WHERE id = ?`,
            [nextDate, new Date().toISOString(), row.id]
          );
        }
      }
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`

**Step 5: Commit**

```bash
git add src/features/transactions/hooks/useProcessRecurring.ts
git commit -m "Update useProcessRecurring to use RecurrenceRule engine"
```

---

### Task 5: Add multiSelect mode to CategoryPicker

**Files:**
- Modify: `src/components/ui/CategoryPicker.tsx`

**Context:** The CategoryPicker currently supports single-select only. Add a `multiSelect` prop that enables toggle-on/off behavior without closing the modal. When `multiSelect` is true, the component uses `selectedIds: Set<string>` and `onToggle` props instead of `selectedId` and `onSelect`. The "All Categories" row toggles all on/off.

**Step 1: Update CategoryPicker props and implementation**

Rewrite `src/components/ui/CategoryPicker.tsx`:

```tsx
import { View, Text, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Modal } from "@/components/ui/Modal";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type SingleSelectProps = {
  multiSelect?: false;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  selectedIds?: never;
  onToggle?: never;
};

type MultiSelectProps = {
  multiSelect: true;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  selectedId?: never;
  onSelect?: never;
};

type CategoryPickerProps = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  showAll?: boolean;
} & (SingleSelectProps | MultiSelectProps);

export function CategoryPicker(props: CategoryPickerProps) {
  const { visible, onClose, categories, showAll = false, multiSelect } = props;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const allSelected = multiSelect
    ? props.selectedIds.size === 0 || props.selectedIds.size === categories.length
    : false;

  const items: { id: string | null; name: string; icon: string | null }[] = [
    ...(showAll ? [{ id: null, name: "All Categories", icon: null }] : []),
    ...categories,
  ];

  const isSelected = (id: string | null): boolean => {
    if (multiSelect) {
      if (id === null) return allSelected;
      return props.selectedIds.size === 0 || props.selectedIds.has(id);
    }
    return id === props.selectedId;
  };

  const handlePress = (id: string | null) => {
    if (multiSelect) {
      if (id === null) {
        // Toggle all — if all selected, clear to empty set (which means all);
        // if subset, clear to empty (all)
        // Pressing "All" always resets to "all selected" (empty set)
        categories.forEach((c) => {
          if (props.selectedIds.has(c.id)) {
            props.onToggle(c.id); // remove it
          }
        });
      } else {
        props.onToggle(id);
      }
    } else {
      props.onSelect(id);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Select Category"
      actionLabel={multiSelect ? "Done" : undefined}
      onAction={multiSelect ? onClose : undefined}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? "all"}
        contentContainerClassName="px-6 pb-6"
        renderItem={({ item }) => {
          const selected = isSelected(item.id);
          return (
            <Pressable
              onPress={() => handlePress(item.id)}
              className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-700"
            >
              {item.icon ? (
                <Text className="text-lg mr-3">{item.icon}</Text>
              ) : (
                <View className="w-6 mr-3" />
              )}
              <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">
                {item.name}
              </Text>
              {selected && (
                <Ionicons
                  name="checkmark"
                  size={22}
                  color={isDark ? "#60a5fa" : "#2563eb"}
                />
              )}
            </Pressable>
          );
        }}
      />
    </Modal>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`
Expected: No errors (existing single-select call sites should still work)

**Step 3: Commit**

```bash
git add src/components/ui/CategoryPicker.tsx
git commit -m "Add multiSelect mode to CategoryPicker component"
```

---

### Task 6: Update transactions filter to use multiselect categories

**Files:**
- Modify: `src/app/(tabs)/transactions/index.tsx`

**Context:** Replace `filterCategory: string | null` with `filterCategories: Set<string>`. Update the filter button display to show "All Categories" or "Categories (N)". Update the `CategoryPicker` usage to `multiSelect` mode. Update the `filteredTransactions` memo.

**Step 1: Update state and filter logic**

Replace `filterCategory` state (line 36):
```tsx
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
```

Remove `showCategoryFilter` if it exists and add:
```tsx
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
```

Add a toggle handler:
```tsx
  const handleToggleCategory = useCallback((id: string) => {
    setFilterCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
```

Update `filteredTransactions` memo — replace the `filterCategory` check (lines 53-55):
```tsx
    if (filterCategories.size > 0) {
      result = result.filter((t) => filterCategories.has(t.category_id));
    }
```

Update the dependency array to use `filterCategories` instead of `filterCategory`.

**Step 2: Update the filter button display**

Replace the filter dropdown `Pressable` text:
```tsx
        <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">
          {filterCategories.size === 0
            ? "All Categories"
            : `Categories (${filterCategories.size})`}
        </Text>
```

**Step 3: Update CategoryPicker usage**

Replace the existing `CategoryPicker` call with:
```tsx
      <CategoryPicker
        visible={showCategoryFilter}
        onClose={() => setShowCategoryFilter(false)}
        categories={categories}
        selectedIds={filterCategories}
        onToggle={handleToggleCategory}
        multiSelect
        showAll
      />
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`

**Step 5: Commit**

```bash
git add src/app/\(tabs\)/transactions/index.tsx
git commit -m "Update category filter to multiselect with count badge"
```

---

### Task 7: Create RecurrencePresetPicker component

**Files:**
- Create: `src/components/transactions/RecurrencePresetPicker.tsx`

**Context:** Shown when the user toggles "Make recurring" ON. Displays smart presets based on the selected transaction date, plus a "Custom..." option. Selecting a preset sets the recurrence rule. Selecting "Custom..." opens the CustomRecurrenceModal (Task 8).

**Step 1: Create the component**

```tsx
// src/components/transactions/RecurrencePresetPicker.tsx
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { type RecurrenceRule, generatePresets, describeRecurrence } from "@/features/transactions/utils/recurrence-rule";

type RecurrencePresetPickerProps = {
  dateStr: string;
  selectedRule: RecurrenceRule | null;
  onSelectRule: (rule: RecurrenceRule) => void;
  onCustomPress: () => void;
};

export function RecurrencePresetPicker({
  dateStr,
  selectedRule,
  onSelectRule,
  onCustomPress,
}: RecurrencePresetPickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const presets = generatePresets(dateStr);

  const selectedDesc = selectedRule ? describeRecurrence(selectedRule) : null;
  const isCustom = selectedRule && !presets.some((p) => describeRecurrence(p.rule) === selectedDesc);

  return (
    <View className="mb-3">
      {presets.map((preset, i) => {
        const isSelected = selectedDesc === preset.label || selectedDesc === describeRecurrence(preset.rule);
        return (
          <Pressable
            key={i}
            onPress={() => onSelectRule(preset.rule)}
            className={`flex-row items-center py-2.5 px-3 rounded-lg mb-1 ${
              isSelected
                ? "bg-primary-50 dark:bg-primary-900/20"
                : ""
            }`}
          >
            <Ionicons
              name={isSelected ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={isSelected ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className={`ml-3 text-sm ${
              isSelected
                ? "text-primary-700 dark:text-primary-300 font-medium"
                : "text-gray-700 dark:text-gray-300"
            }`}>
              {preset.label}
            </Text>
          </Pressable>
        );
      })}

      {/* Custom option */}
      <Pressable
        onPress={onCustomPress}
        className={`flex-row items-center py-2.5 px-3 rounded-lg ${
          isCustom ? "bg-primary-50 dark:bg-primary-900/20" : ""
        }`}
      >
        <Ionicons
          name={isCustom ? "radio-button-on" : "radio-button-off"}
          size={20}
          color={isCustom ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
        />
        <Text className={`ml-3 text-sm ${
          isCustom
            ? "text-primary-700 dark:text-primary-300 font-medium"
            : "text-gray-700 dark:text-gray-300"
        }`}>
          {isCustom && selectedRule ? describeRecurrence(selectedRule) : "Custom..."}
        </Text>
      </Pressable>
    </View>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`

**Step 3: Commit**

```bash
git add src/components/transactions/RecurrencePresetPicker.tsx
git commit -m "Add RecurrencePresetPicker component with smart date presets"
```

---

### Task 8: Create CustomRecurrenceModal component

**Files:**
- Create: `src/components/transactions/CustomRecurrenceModal.tsx`

**Context:** Full-screen modal with: interval stepper + frequency picker, contextual day-of-week or monthly-anchor selection, end-condition radio group, live summary preview. This is the most complex UI component in this plan.

**Step 1: Create the component**

```tsx
// src/components/transactions/CustomRecurrenceModal.tsx
import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { getDay, getDate, format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { type RecurrenceRule, describeRecurrence } from "@/features/transactions/utils/recurrence-rule";

type CustomRecurrenceModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: RecurrenceRule) => void;
  initialRule?: RecurrenceRule | null;
  referenceDate: string; // The transaction date, used for defaults
};

const FREQ_OPTIONS: { label: string; value: RecurrenceRule["frequency"] }[] = [
  { label: "Day", value: "daily" },
  { label: "Week", value: "weekly" },
  { label: "Month", value: "monthly" },
  { label: "Year", value: "yearly" },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const ORDINAL_LABELS = ["first", "second", "third", "fourth", "last"];
const ORDINAL_VALUES = [1, 2, 3, 4, -1];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function CustomRecurrenceModal({
  visible,
  onClose,
  onSave,
  initialRule,
  referenceDate,
}: CustomRecurrenceModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const refDate = new Date(referenceDate + "T00:00:00");

  const [frequency, setFrequency] = useState<RecurrenceRule["frequency"]>("monthly");
  const [interval, setInterval] = useState(1);
  const [byDayOfWeek, setByDayOfWeek] = useState<number[]>([]);
  const [monthlyMode, setMonthlyMode] = useState<"day" | "ordinal">("day");
  const [byMonthDay, setByMonthDay] = useState<number[]>([]);
  const [bySetPos, setBySetPos] = useState(1);
  const [ordinalDay, setOrdinalDay] = useState(0);
  const [endType, setEndType] = useState<RecurrenceRule["endType"]>("never");
  const [endDate, setEndDate] = useState("");
  const [endCount, setEndCount] = useState("12");

  // Initialize from initialRule or referenceDate
  useEffect(() => {
    if (initialRule) {
      setFrequency(initialRule.frequency);
      setInterval(initialRule.interval);
      setByDayOfWeek(initialRule.byDayOfWeek ?? []);
      setEndType(initialRule.endType);
      setEndDate(initialRule.endDate ?? "");
      setEndCount(initialRule.endCount?.toString() ?? "12");

      if (initialRule.byMonthDay) {
        setMonthlyMode("day");
        setByMonthDay(initialRule.byMonthDay);
      } else if (initialRule.bySetPos != null && initialRule.byDayOfWeek) {
        setMonthlyMode("ordinal");
        setBySetPos(initialRule.bySetPos);
        setOrdinalDay(initialRule.byDayOfWeek[0] ?? 0);
      }
    } else {
      // Defaults from reference date
      setByDayOfWeek([getDay(refDate)]);
      setByMonthDay([getDate(refDate)]);
      setOrdinalDay(getDay(refDate));
    }
  }, [initialRule, referenceDate]);

  const buildRule = (): RecurrenceRule => {
    const rule: RecurrenceRule = {
      frequency,
      interval,
      endType,
      endDate: endType === "on_date" ? endDate : undefined,
      endCount: endType === "after_count" ? parseInt(endCount) || 1 : undefined,
    };

    if (frequency === "weekly" && byDayOfWeek.length > 0) {
      rule.byDayOfWeek = [...byDayOfWeek].sort((a, b) => a - b);
    }

    if (frequency === "monthly") {
      if (monthlyMode === "ordinal") {
        rule.bySetPos = bySetPos;
        rule.byDayOfWeek = [ordinalDay];
      } else {
        rule.byMonthDay = byMonthDay;
      }
    }

    return rule;
  };

  const currentRule = buildRule();
  const summary = describeRecurrence(currentRule);

  const toggleDay = (day: number) => {
    setByDayOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDone = () => {
    onSave(buildRule());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Custom Recurrence"
      actionLabel="Done"
      onAction={handleDone}
      fullScreen
    >
      <ScrollView className="px-5 pt-4" keyboardShouldPersistTaps="handled">
        {/* Repeat every N [frequency] */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Repeat every
        </Text>
        <View className="flex-row items-center mb-4">
          {/* Stepper */}
          <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
            <Pressable
              onPress={() => setInterval((v) => Math.max(1, v - 1))}
              className="px-3 py-2"
            >
              <Ionicons name="remove" size={18} color={isDark ? "#d1d5db" : "#374151"} />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 min-w-[28px] text-center">
              {interval}
            </Text>
            <Pressable
              onPress={() => setInterval((v) => v + 1)}
              className="px-3 py-2"
            >
              <Ionicons name="add" size={18} color={isDark ? "#d1d5db" : "#374151"} />
            </Pressable>
          </View>

          {/* Frequency pills */}
          <View className="flex-row flex-1 gap-1">
            {FREQ_OPTIONS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFrequency(f.value)}
                className={`flex-1 py-2 rounded-lg items-center ${
                  frequency === f.value
                    ? "bg-primary-600"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    frequency === f.value
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Contextual: Day-of-week selection (weekly) */}
        {frequency === "weekly" && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              On
            </Text>
            <View className="flex-row justify-between">
              {DAY_LABELS.map((label, i) => {
                const selected = byDayOfWeek.includes(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      selected
                        ? "bg-primary-600"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected ? "text-white" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Contextual: Monthly anchor */}
        {frequency === "monthly" && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              On
            </Text>

            {/* Mode toggle */}
            <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-3">
              <Pressable
                onPress={() => setMonthlyMode("day")}
                className={`flex-1 py-2 rounded-md items-center ${
                  monthlyMode === "day" ? "bg-white dark:bg-gray-700" : ""
                }`}
              >
                <Text className={`text-sm font-medium ${
                  monthlyMode === "day"
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  Day {byMonthDay[0] ?? getDate(refDate)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMonthlyMode("ordinal")}
                className={`flex-1 py-2 rounded-md items-center ${
                  monthlyMode === "ordinal" ? "bg-white dark:bg-gray-700" : ""
                }`}
              >
                <Text className={`text-sm font-medium ${
                  monthlyMode === "ordinal"
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {ORDINAL_LABELS[ORDINAL_VALUES.indexOf(bySetPos)] ?? "first"} {DAY_NAMES_FULL[ordinalDay]}
                </Text>
              </Pressable>
            </View>

            {/* Ordinal selectors (when ordinal mode) */}
            {monthlyMode === "ordinal" && (
              <View>
                <View className="flex-row flex-wrap gap-1.5 mb-2">
                  {ORDINAL_LABELS.map((label, i) => {
                    const val = ORDINAL_VALUES[i];
                    const selected = bySetPos === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setBySetPos(val)}
                        className={`rounded-full px-3 py-1.5 ${
                          selected
                            ? "bg-primary-600"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <Text className={`text-xs font-medium capitalize ${
                          selected ? "text-white" : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {DAY_NAMES_FULL.map((name, i) => {
                    const selected = ordinalDay === i;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => setOrdinalDay(i)}
                        className={`rounded-full px-3 py-1.5 ${
                          selected
                            ? "bg-primary-600"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <Text className={`text-xs font-medium ${
                          selected ? "text-white" : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {name.slice(0, 3)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Ends */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ends
        </Text>
        <View className="mb-4">
          {/* Never */}
          <Pressable
            onPress={() => setEndType("never")}
            className="flex-row items-center py-2.5"
          >
            <Ionicons
              name={endType === "never" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={endType === "never" ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300">Never</Text>
          </Pressable>

          {/* On date */}
          <Pressable
            onPress={() => setEndType("on_date")}
            className="flex-row items-center py-2.5"
          >
            <Ionicons
              name={endType === "on_date" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={endType === "on_date" ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300">On date</Text>
          </Pressable>
          {endType === "on_date" && (
            <View className="ml-9 mt-1">
              <DatePicker
                label=""
                value={endDate}
                onChange={setEndDate}
                minDate={referenceDate}
                compact
              />
            </View>
          )}

          {/* After N occurrences */}
          <Pressable
            onPress={() => setEndType("after_count")}
            className="flex-row items-center py-2.5"
          >
            <Ionicons
              name={endType === "after_count" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={endType === "after_count" ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300">After</Text>
            {endType === "after_count" && (
              <View className="flex-row items-center ml-2">
                <TextInput
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 min-w-[48px] text-center"
                  value={endCount}
                  onChangeText={setEndCount}
                  keyboardType="number-pad"
                />
                <Text className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  occurrences
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Live summary */}
        <View className="bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3 mb-4">
          <Text className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {summary}
          </Text>
        </View>

        <View className="h-8" />
      </ScrollView>
    </Modal>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`

**Step 3: Commit**

```bash
git add src/components/transactions/CustomRecurrenceModal.tsx
git commit -m "Add CustomRecurrenceModal with interval, day-of-week, monthly, and end condition controls"
```

---

### Task 9: Update AddTransactionSheet to use new recurrence UI

**Files:**
- Modify: `src/components/transactions/AddTransactionSheet.tsx`

**Context:** Replace the 4 frequency chips + end date picker with: RecurrencePresetPicker (when recurring is on), and wire up CustomRecurrenceModal. The `onSaveRecurring` callback changes to accept `RecurrenceRule` instead of `frequency` + `startDate` + `endDate`. The recurring state changes from `frequency: Frequency` to `recurrenceRule: RecurrenceRule | null`.

**Step 1: Update imports**

Add to imports:
```tsx
import { RecurrencePresetPicker } from "@/components/transactions/RecurrencePresetPicker";
import { CustomRecurrenceModal } from "@/components/transactions/CustomRecurrenceModal";
import { type RecurrenceRule } from "@/features/transactions/utils/recurrence-rule";
```

Remove the `Frequency` import if still present.

**Step 2: Update the onSaveRecurring type**

In `AddTransactionSheetProps`, replace the `onSaveRecurring` signature:
```tsx
  onSaveRecurring?: (data: {
    description: string;
    payee?: string;
    amount: number;
    categoryId: string;
    transactionType: string;
    recurrenceRule: RecurrenceRule;
    startDate: string;
  }) => Promise<void>;
```

**Step 3: Update state**

Remove:
```tsx
const [frequency, setFrequency] = useState<Frequency>("monthly");
```

Add:
```tsx
const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
```

Remove the `FREQUENCIES` constant array.

Update `resetForm` — remove `setFrequency("monthly")`, add:
```tsx
    setRecurrenceRule(null);
    setShowCustomRecurrence(false);
```

Remove `endDate` from the zod schema, `defaultValues`, and `resetForm` reset call (end dates are now inside the RecurrenceRule).

Update `hasUnsavedChanges` — replace `isRecurring` check with `isRecurring || recurrenceRule !== null`.

**Step 4: Update the onSubmit handler**

Replace the recurring save block:
```tsx
      if (isRecurring && onSaveRecurring && recurrenceRule) {
        await onSaveRecurring({
          description: resolvedDescription,
          payee: data.payee?.trim() || undefined,
          amount,
          categoryId: selectedCategory,
          transactionType: txType,
          recurrenceRule,
          startDate: data.txDate,
        });
      }
```

**Step 5: Replace the recurring toggle UI section**

Replace the entire `{/* Recurring toggle */}` block (the `{onSaveRecurring && (...)}` section) with:

```tsx
        {/* Recurring toggle */}
        {onSaveRecurring && (
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Make recurring
              </Text>
              <Switch value={isRecurring} onValueChange={setIsRecurring} />
            </View>

            {isRecurring && (
              <RecurrencePresetPicker
                dateStr={watch("txDate")}
                selectedRule={recurrenceRule}
                onSelectRule={setRecurrenceRule}
                onCustomPress={() => setShowCustomRecurrence(true)}
              />
            )}
          </View>
        )}

        <CustomRecurrenceModal
          visible={showCustomRecurrence}
          onClose={() => setShowCustomRecurrence(false)}
          onSave={(rule) => setRecurrenceRule(rule)}
          initialRule={recurrenceRule}
          referenceDate={watch("txDate")}
        />
```

**Step 6: Remove the endDate Controller**

Remove the entire `<Controller control={control} name="endDate" ... />` block and the `endDate` field from the schema, defaultValues, and resetForm.

The schema becomes:
```tsx
const transactionSchema = z.object({
  description: z.string(),
  payee: z.string().optional(),
  txDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});
```

Remove `watchedTxDate` if it was only used for the endDate minDate prop. Use `watch("txDate")` inline instead.

**Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`
Expected: Errors in `transactions/index.tsx` for `handleSaveRecurring` signature — fix in next step.

**Step 8: Update handleSaveRecurring in transactions/index.tsx**

In `src/app/(tabs)/transactions/index.tsx`, update the `handleSaveRecurring` callback to match the new signature:

```tsx
  const handleSaveRecurring = useCallback(
    async (data: {
      description: string;
      payee?: string;
      amount: number;
      categoryId: string;
      transactionType: string;
      recurrenceRule: RecurrenceRule;
      startDate: string;
    }) => {
      if (!householdId) return;
      await addRecurring({ ...data, householdId });
    },
    [addRecurring, householdId]
  );
```

Add the import:
```tsx
import { type RecurrenceRule } from "@/features/transactions/utils/recurrence-rule";
```

Remove the old `Frequency` import if present.

**Step 9: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`
Expected: No errors

**Step 10: Commit**

```bash
git add src/components/transactions/AddTransactionSheet.tsx src/app/\(tabs\)/transactions/index.tsx
git commit -m "Replace frequency chips with recurrence preset picker and custom modal"
```

---

### Task 10: Update recurring transactions list screen

**Files:**
- Modify: `src/app/(tabs)/transactions/recurring.tsx`

**Context:** The recurring list currently shows a hardcoded `FREQUENCY_LABELS` map. Replace with the `recurrenceDescription` field computed by the hook. This is a simple display change.

**Step 1: Update the frequency display**

Remove the `FREQUENCY_LABELS` constant (lines 11-16).

In the card rendering (line 82), replace:
```tsx
                {FREQUENCY_LABELS[rt.frequency] ?? rt.frequency}
```
with:
```tsx
                {rt.recurrenceDescription ?? rt.frequency}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v seed-demo-data`

**Step 3: Commit**

```bash
git add src/app/\(tabs\)/transactions/recurring.tsx
git commit -m "Display human-readable recurrence descriptions in recurring list"
```

---

### Task 11: Final verification and cleanup

**Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors (pre-existing seed-demo-data error is acceptable)

**Step 2: Clean up old recurring-engine.ts**

Check if `recurring-engine.ts` is still imported anywhere. If `useProcessRecurring.ts` was the last consumer and it now uses `recurrence-rule.ts`, delete the old file:

```bash
# Check for remaining imports
grep -r "recurring-engine" src/
```

If no remaining imports, delete it:
```bash
rm src/features/transactions/utils/recurring-engine.ts
git add -A
git commit -m "Remove deprecated recurring-engine.ts, replaced by recurrence-rule.ts"
```

**Step 3: Visual review checklist (manual)**

- [ ] Transactions list: category filter shows multiselect with count badge
- [ ] Add transaction: toggling recurring shows smart presets based on date
- [ ] Preset selection shows human-readable summary
- [ ] "Custom..." opens full recurrence builder modal
- [ ] Custom modal: interval stepper works, frequency pills change contextual section
- [ ] Weekly: day-of-week circles toggle correctly
- [ ] Monthly: "Day N" vs "Nth Weekday" toggle works
- [ ] Ends: Never / On date / After N all work
- [ ] Live summary updates as options change
- [ ] Recurring transactions list shows new descriptions
- [ ] All modals dismiss correctly
