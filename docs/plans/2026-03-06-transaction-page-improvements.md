# Transaction Page Improvements Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix UX issues on the transactions page — replace funky category pills with dropdowns, make add-transaction full-screen, make description optional with category-name fallback, and add notes field.

**Architecture:** Create a shared `CategoryPicker` modal component used in 3 places: the transactions list filter, the add form, and the edit form. Extend the existing `Modal` component with a `fullScreen` prop. Relax description validation across all schemas.

**Tech Stack:** React Native, Expo Router, NativeWind v4, react-hook-form, zod, PowerSync

**Worktree:** `/Users/chaz80hd/github.com/ibudget-tx-improvements` (branch: `feature/tx-page-improvements`)

**Beads issues:** ibudget-2nz, ibudget-367, ibudget-5d5, ibudget-chs, ibudget-arj, ibudget-56p

---

### Task 1: Create CategoryPicker Shared Component (ibudget-2nz)

**Files:**
- Create: `src/components/ui/CategoryPicker.tsx`

**Context:** This is a reusable modal that shows a list of categories with checkmarks. It's used by the filter dropdown (where "All" is an option) and by the add/edit forms (where a category must be selected). It accepts a `showAll` prop to control whether "All" appears.

**Step 1: Create the CategoryPicker component**

```tsx
// src/components/ui/CategoryPicker.tsx
import { View, Text, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Modal } from "@/components/ui/Modal";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type CategoryPickerProps = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showAll?: boolean;
};

export function CategoryPicker({
  visible,
  onClose,
  categories,
  selectedId,
  onSelect,
  showAll = false,
}: CategoryPickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const items: { id: string | null; name: string; icon: string | null }[] = [
    ...(showAll ? [{ id: null, name: "All Categories", icon: null }] : []),
    ...categories,
  ];

  return (
    <Modal visible={visible} onClose={onClose} title="Select Category">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? "all"}
        contentContainerClassName="px-6 pb-6"
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          return (
            <Pressable
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
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
              {isSelected && (
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

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/CategoryPicker.tsx
git commit -m "Add shared CategoryPicker modal component"
```

---

### Task 2: Add fullScreen prop to Modal (ibudget-5d5)

**Files:**
- Modify: `src/components/ui/Modal.tsx`

**Context:** The existing Modal is a bottom sheet (`justify-end`, `rounded-t-3xl`, `max-h-[85%]`). We add a `fullScreen` prop that removes these constraints so the modal fills the entire screen. This is used by AddTransactionSheet.

**Step 1: Add fullScreen prop to Modal**

In `src/components/ui/Modal.tsx`, add `fullScreen?: boolean` to the `ModalProps` type and conditionally apply styles:

- Add `fullScreen` to the props destructuring (default `false`)
- On the outer `<View className="flex-1 justify-end bg-black/50">`: when `fullScreen`, change to `"flex-1 bg-black/50"` (remove `justify-end`)
- On the inner `<View className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85%]">`: when `fullScreen`, change to `"flex-1 bg-white dark:bg-gray-900"` (remove `rounded-t-3xl` and `max-h-[85%]`, add `flex-1`)

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ui/Modal.tsx
git commit -m "Add fullScreen prop to Modal component"
```

---

### Task 3: Replace category filter chips with dropdown (ibudget-367)

**Files:**
- Modify: `src/app/(tabs)/transactions/index.tsx`

**Context:** Remove the horizontal `FlatList` of pill chips (lines 158-183) and replace with a `Pressable` button that shows the current filter category. Tapping opens the `CategoryPicker` modal with `showAll={true}`.

**Step 1: Update imports and add state**

In `src/app/(tabs)/transactions/index.tsx`:
- Add import: `import { CategoryPicker } from "@/components/ui/CategoryPicker";`
- Add state: `const [showCategoryFilter, setShowCategoryFilter] = useState(false);`
- Remove `useEffect` and `useCallback` from imports if no longer needed (check first)

**Step 2: Replace the FlatList filter chips**

Replace the entire `{/* Category filter chips */}` block (the horizontal FlatList, lines 158-183) with:

```tsx
{/* Category filter dropdown */}
<Pressable
  onPress={() => setShowCategoryFilter(true)}
  className="mx-4 mb-2 flex-row items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600"
>
  <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">
    {filterCategory
      ? `${categories.find((c) => c.id === filterCategory)?.icon ?? ""} ${categories.find((c) => c.id === filterCategory)?.name ?? ""}`.trim()
      : "All Categories"}
  </Text>
  <Ionicons name="chevron-down" size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
</Pressable>

<CategoryPicker
  visible={showCategoryFilter}
  onClose={() => setShowCategoryFilter(false)}
  categories={categories}
  selectedId={filterCategory}
  onSelect={setFilterCategory}
  showAll
/>
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app/(tabs)/transactions/index.tsx
git commit -m "Replace category filter chips with dropdown picker"
```

---

### Task 4: Make AddTransactionSheet full-screen (ibudget-5d5 continued)

**Files:**
- Modify: `src/components/transactions/AddTransactionSheet.tsx`

**Context:** Pass `fullScreen` to the `Modal` in `AddTransactionSheet` so the form fills the entire screen.

**Step 1: Add fullScreen prop to Modal usage**

In `AddTransactionSheet.tsx` line 150, change:
```tsx
<Modal visible={visible} onClose={onClose} title="Add Transaction">
```
to:
```tsx
<Modal visible={visible} onClose={onClose} title="Add Transaction" fullScreen>
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/transactions/AddTransactionSheet.tsx
git commit -m "Make add transaction sheet full-screen"
```

---

### Task 5: Make description optional with category fallback (ibudget-chs)

**Files:**
- Modify: `src/components/transactions/AddTransactionSheet.tsx`
- Modify: `src/app/(tabs)/transactions/[id].tsx`
- Modify: `src/features/transactions/schemas/transaction.schema.ts`

**Context:** Remove the `min(1)` requirement from description in all three zod schemas. When saving, if description is blank, store the selected category's name instead.

**Step 1: Update zod schemas**

In `AddTransactionSheet.tsx` line 17, change:
```tsx
description: z.string().min(1, "Description is required"),
```
to:
```tsx
description: z.string().optional().default(""),
```

In `[id].tsx` line 24, change:
```tsx
description: z.string().min(1, "Description is required"),
```
to:
```tsx
description: z.string().optional().default(""),
```

In `transaction.schema.ts` line 6, change:
```tsx
description: z.string().min(1, "Description is required").max(500),
```
to:
```tsx
description: z.string().max(500).optional().default(""),
```

**Step 2: Update AddTransactionSheet placeholder**

In `AddTransactionSheet.tsx`, change the description FormField placeholder (line 190):
```tsx
placeholder="What was this for?"
```
to:
```tsx
placeholder="Description (optional)"
```

**Step 3: Add category-name fallback in AddTransactionSheet.onSubmit**

In `AddTransactionSheet.tsx` inside the `onSubmit` handler, after the validation checks (around line 113), resolve the description:

```tsx
const resolvedDescription =
  data.description?.trim() ||
  categories.find((c) => c.id === selectedCategory)?.name ||
  "Transaction";
```

Then use `resolvedDescription` instead of `data.description.trim()` in both the `onSave` call (line 117) and the `onSaveRecurring` call (line 128).

**Step 4: Add category-name fallback in [id].tsx edit onSubmit**

In `[id].tsx` inside the `onSubmit` handler (line 80), add:

```tsx
const resolvedDescription =
  data.description?.trim() ||
  categories.find((c) => c.id === selectedCategory)?.name ||
  "Transaction";
```

Then use `resolvedDescription` instead of `data.description` in the `updateTransaction` call (line 83).

**Step 5: Update the description label in [id].tsx edit form**

In `[id].tsx` line 127, change:
```tsx
label="Description"
```
to:
```tsx
label="Description (optional)"
```

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/components/transactions/AddTransactionSheet.tsx src/app/(tabs)/transactions/\[id\].tsx src/features/transactions/schemas/transaction.schema.ts
git commit -m "Make description optional, fall back to category name"
```

---

### Task 6: Replace category chips in add/edit forms with dropdown (ibudget-arj)

**Files:**
- Modify: `src/components/transactions/AddTransactionSheet.tsx`
- Modify: `src/app/(tabs)/transactions/[id].tsx`

**Context:** Replace the `flex-wrap` chip grid in both the add and edit forms with a `Pressable` button + `CategoryPicker` modal.

**Step 1: Update AddTransactionSheet**

Add import:
```tsx
import { CategoryPicker } from "@/components/ui/CategoryPicker";
```

Add state:
```tsx
const [showCategoryPicker, setShowCategoryPicker] = useState(false);
```

Reset it in `resetForm`:
```tsx
setShowCategoryPicker(false);
```

Replace the category picker section (lines 208-230 — the label, View with flex-wrap, and all the chip Pressables) with:

```tsx
<Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</Text>
<Pressable
  onPress={() => setShowCategoryPicker(true)}
  className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-500 mb-4"
>
  <Text className={`flex-1 text-base ${selectedCategory ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
    {selectedCategory
      ? `${categories.find((c) => c.id === selectedCategory)?.icon ?? ""} ${categories.find((c) => c.id === selectedCategory)?.name ?? ""}`.trim()
      : "Select a category"}
  </Text>
  <Ionicons name="chevron-down" size={18} color="#9ca3af" />
</Pressable>

<CategoryPicker
  visible={showCategoryPicker}
  onClose={() => setShowCategoryPicker(false)}
  categories={categories}
  selectedId={selectedCategory}
  onSelect={(id) => setSelectedCategory(id ?? "")}
/>
```

Note: Need to add `Ionicons` import if not already present. Check first.

**Step 2: Update [id].tsx edit mode**

Same pattern. Add imports for `CategoryPicker` and `Ionicons` (Ionicons is already imported via Pressable usage — check).

Add state:
```tsx
const [showCategoryPicker, setShowCategoryPicker] = useState(false);
```

Replace the category chip section in edit mode (lines 142-163) with the same dropdown pattern as Step 1.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/transactions/AddTransactionSheet.tsx src/app/(tabs)/transactions/\[id\].tsx
git commit -m "Replace category chips in forms with dropdown picker"
```

---

### Task 7: Add notes field to AddTransactionSheet (ibudget-56p)

**Files:**
- Modify: `src/components/transactions/AddTransactionSheet.tsx`

**Context:** Add an optional multi-line notes field to the form. The `onSave` callback already accepts `notes?`. We need to add a form field and wire it through.

**Step 1: Add notes to the zod schema**

In `AddTransactionSheet.tsx`, update the schema (around line 16):

```tsx
const transactionSchema = z.object({
  description: z.string().optional().default(""),
  payee: z.string().optional(),
  txDate: z.string().min(1, "Date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});
```

**Step 2: Update defaultValues**

In the `useForm` call, add `notes: ""` to `defaultValues`.

In `resetForm`, add `notes: ""` to the `reset()` call.

**Step 3: Add the FormField**

After the CategoryPicker section and before the recurring toggle, add:

```tsx
<FormField
  control={control}
  name="notes"
  label="Notes (optional)"
  placeholder="Any additional details..."
  multiline
/>
```

Note: Check if `FormField` supports a `multiline` prop. If not, use a `Controller` with a `TextInput` that has `multiline` and `numberOfLines={3}`.

**Step 4: Wire notes through to onSave**

In the `onSubmit` handler, update the `onSave` call to include notes:

```tsx
await onSave({
  description: resolvedDescription,
  payee: data.payee?.trim() || undefined,
  amount,
  categoryId: selectedCategory,
  transactionType: txType,
  transactionDate: data.txDate,
  notes: data.notes?.trim() || undefined,
});
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/components/transactions/AddTransactionSheet.tsx
git commit -m "Add optional notes field to add transaction form"
```

---

### Task 8: Final verification and cleanup

**Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Visual review checklist (manual)**

- [ ] Transactions list: filter dropdown opens CategoryPicker, selects category, filters list
- [ ] Add transaction: full-screen modal, description optional, category dropdown, notes field
- [ ] Edit transaction: description optional, category dropdown
- [ ] Creating transaction without description stores category name
- [ ] All modals dismiss correctly

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "Final cleanup for transaction page improvements"
```
