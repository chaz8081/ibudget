# Recurring Transaction UX Redesign + Category Multiselect

**Date:** 2026-03-06
**Goal:** Replace the rigid 4-option recurring frequency picker with a Google Calendar-style recurrence builder (presets + custom), and convert the category filter to multiselect.

---

## 1. Recurrence Data Model

Expand the `Frequency` type to a full `RecurrenceRule`:

```typescript
type RecurrenceRule = {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;           // Every N [frequency]
  byDayOfWeek?: number[];     // 0=Sun..6=Sat (weekly/monthly)
  byMonthDay?: number[];      // 1-31 (monthly)
  bySetPos?: number;          // -1=last, 1=first, 2=second, 3=third, 4=fourth (monthly ordinal)
  endType: "never" | "on_date" | "after_count";
  endDate?: string;           // When endType = "on_date"
  endCount?: number;          // When endType = "after_count"
};
```

### DB Schema Changes

New nullable columns on `recurring_transactions`:
- `by_day_of_week TEXT` — JSON array of day indices (e.g. `[1,3,5]` for Mon/Wed/Fri)
- `by_month_day TEXT` — JSON array of month days (e.g. `[1,15]`)
- `by_set_pos INTEGER` — ordinal position (-1=last, 1-4=first through fourth)
- `end_type TEXT DEFAULT 'never'` — "never" | "on_date" | "after_count"
- `end_count INTEGER` — number of occurrences when end_type = "after_count"

Existing columns `frequency`, `interval`, `end_date` are retained. The `frequency` column adds `"daily"` as a valid value.

### Migration

Existing rows: set `end_type = end_date IS NOT NULL ? 'on_date' : 'never'`. No other changes needed — existing data maps cleanly (weekly/biweekly/monthly/yearly with interval=1).

`"biweekly"` is migrated to `frequency="weekly", interval=2` and the value is removed from the type.

---

## 2. Recurrence Engine Updates

`recurring-engine.ts` must be updated to:
- Accept `RecurrenceRule` instead of `Frequency`
- Handle `"daily"` frequency via `addDays`
- Calculate next occurrence respecting `byDayOfWeek` (find next matching day), `byMonthDay` (find next matching day of month), and `bySetPos` (find Nth weekday of month)
- Check end conditions: skip if past `endDate`, or if occurrence count >= `endCount`

### Human-Readable Summary

A `describeRecurrence(rule: RecurrenceRule): string` function that produces natural language:
- "Every day"
- "Every 2 weeks on Mon, Wed, Fri"
- "Monthly on the 15th"
- "Monthly on the third Tuesday"
- "Every 3 months on the 1st, ends after 12 occurrences"
- "Every year on March 6"

---

## 3. Recurrence UI — Presets + Custom Builder

### Preset Picker

When the user toggles "Make recurring" ON, show a list of smart presets derived from the selected transaction date. For a date of Wednesday, March 6, 2026:

- Every week on Wednesday
- Every 2 weeks on Wednesday
- Every month on the 6th
- Every year on March 6
- Custom...

Selecting a preset sets the recurrence rule immediately and displays a human-readable summary.

### Custom Recurrence Modal

A full-screen modal with sections:

1. **Repeat every** — number input (stepper) + frequency picker (Day / Week / Month / Year)
2. **On** (contextual, appears based on frequency):
   - **Weekly**: Day-of-week toggle buttons (S M T W T F S), multi-select
   - **Monthly**: Toggle between "On day [N]" and "On the [ordinal] [weekday]"
   - **Daily/Yearly**: Section hidden
3. **Ends** — Radio group:
   - Never
   - On date → date picker
   - After → number input + "occurrences" label
4. **Summary** — Live preview string at bottom: "Every 2 weeks on Mon, Wed"
5. **Done** button in header — closes modal, applies rule

### Style

Match existing app patterns:
- NativeWind styling, dark mode support
- Compact spacing matching the recent UI redesign
- Day-of-week toggles as small circular buttons (like Google Calendar)
- Number stepper with - / + buttons flanking the value

---

## 4. Category Multiselect Filter

### CategoryPicker Changes

Add `multiSelect?: boolean` prop to `CategoryPicker`:

- **Single-select mode** (existing, used in add/edit forms): tap selects + closes modal
- **Multi-select mode** (new, used in filter): tap toggles checkmark, modal stays open, "Done" button closes

When `multiSelect` is true:
- Props change from `selectedId: string | null` + `onSelect` to `selectedIds: Set<string>` + `onToggle`
- "All Categories" row toggles all on/off
- Header shows "Done" button instead of auto-closing on select

### Transactions Filter Changes

State changes from `filterCategory: string | null` to `filterCategories: Set<string>` (empty = all).

Filter button display:
- All selected (or empty set): "All Categories"
- Subset: "Categories (N)" where N is the count

Filter logic: `result.filter(t => filterCategories.size === 0 || filterCategories.has(t.category_id))`

---

## 5. Files Affected

### New Files
- `src/components/transactions/RecurrencePresetPicker.tsx` — preset list
- `src/components/transactions/CustomRecurrenceModal.tsx` — full builder modal
- `src/features/transactions/utils/recurrence-rule.ts` — RecurrenceRule type, describe function, next-occurrence calculator

### Modified Files
- `src/components/ui/CategoryPicker.tsx` — add multiSelect mode
- `src/components/transactions/AddTransactionSheet.tsx` — replace frequency chips with preset picker
- `src/app/(tabs)/transactions/index.tsx` — multiselect filter state + display
- `src/features/transactions/hooks/useRecurringTransactions.ts` — accept RecurrenceRule
- `src/features/transactions/utils/recurring-engine.ts` — updated calculation logic (or replaced by recurrence-rule.ts)
- `src/db/tables.ts` — new columns
- PowerSync schema migration
