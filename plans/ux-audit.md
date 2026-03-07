# UX Audit — iBudget

Date: 2026-03-07
Method: Code review of all 30 components + Puppeteer visual inspection of all screens

## P0 — Broken

### 1. AssignIncomeModal content overflows on web
**File:** `src/components/budget/AssignIncomeModal.tsx` + `src/components/ui/Modal.tsx`
**Issue:** Modal uses `max-h-[85%]` but when there are many categories, the content pushes the header and top categories off-screen. Puppeteer screenshot confirmed: header at y=-1505px, only bottom categories visible. Modal is partially unusable.
**Fix:** Add proper ScrollView containment inside modal body with flex constraints.

### 2. DatePicker day buttons below minimum touch target
**File:** `src/components/ui/DatePicker.tsx:142`
**Issue:** Day buttons are `w-9 h-9` (36x36px), below the 44pt accessibility minimum.
**Fix:** Increase to `w-11 h-11` (44x44px).

### 3. CustomRecurrenceModal day-of-week buttons too small
**File:** `src/components/transactions/CustomRecurrenceModal.tsx:193`
**Issue:** Day-of-week selection circles are `w-10 h-10` (40x40px), below 44pt minimum.
**Fix:** Increase to `w-11 h-11`.

### 4. Modal close button touch target too small
**File:** `src/components/ui/Modal.tsx:45`
**Issue:** Close/action buttons use `p-2` (8px padding), resulting in ~32px touch target.
**Fix:** Increase to `p-3` minimum.

## P1 — Confusing

### 5. EnvelopeCard no pressed/active state feedback
**File:** `src/components/budget/EnvelopeCard.tsx:16`
**Issue:** Card is wrapped in Pressable but has no visual feedback when pressed. Users can't tell it's interactive.
**Fix:** Add opacity or background change on press via style prop.

### 6. TransactionItem no pressed state feedback
**File:** `src/components/transactions/TransactionItem.tsx`
**Issue:** Same as EnvelopeCard — Pressable without visual feedback.
**Fix:** Add active state styling.

### 7. CurrencyInput missing error state
**File:** `src/components/forms/CurrencyInput.tsx`
**Issue:** Unlike Input.tsx, CurrencyInput doesn't accept or display error state. When validation fails, user gets no feedback on the currency field.
**Fix:** Add error prop and red border styling matching Input.tsx.

### 8. Button disabled state too subtle
**File:** `src/components/ui/Button.tsx:60`
**Issue:** Disabled buttons only get `opacity-50`, which is hard to distinguish especially on smaller screens.
**Fix:** Add cursor-not-allowed (web) and more distinct opacity.

### 9. FAB uses raw "+" text instead of icon
**File:** `src/app/(tabs)/transactions/index.tsx:232`
**Issue:** Floating action button uses `<Text>+</Text>` instead of Ionicons, inconsistent with rest of app.
**Fix:** Replace with `<Ionicons name="add" />`.

### 10. BudgetSummary uses warning color for positive unassigned
**File:** `src/components/budget/BudgetSummary.tsx:45-51`
**Issue:** Unassigned positive income shows in warning color (yellow/orange), but positive unassigned is good — it means money is available. Warning semantics are incorrect.
**Fix:** Use success (green) for positive, warning for near-zero, danger for negative.

## P2 — Polish

### 11. DatePicker day labels ambiguous
**File:** `src/components/ui/DatePicker.tsx:33`
Two "T" (Tue/Thu) and two "S" (Sat/Sun) single-letter labels.
**Effort:** 5 min — change to 2-letter abbreviations.

### 12. Card shadow hardcoded inline
**File:** `src/components/ui/Card.tsx:11`
Shadow values as inline style objects instead of theme constants.
**Effort:** 15 min — extract to shared constants.

### 13. ProgressBar missing accessibility label
**File:** `src/components/ui/ProgressBar.tsx`
No accessible label describing what the bar represents.
**Effort:** 5 min — add accessibilityLabel and accessibilityValue.

### 14. Inconsistent section spacing across screens
Dashboard uses `mb-4`, envelopes `mb-3`, transactions mixed.
**Effort:** 20 min — standardize spacing scale.

### 15. Edit Profile cramped top spacing
**File:** `src/app/(tabs)/settings/profile.tsx`
Email field sits too close to header bar.
**Effort:** 2 min — add `pt-2` spacing.

### 16. CategoryPicker no selection feedback
**File:** `src/components/ui/CategoryPicker.tsx:92`
List items have no active state on press.
**Effort:** 5 min — add pressed state.

### 17. AddTransactionSheet $ sign misaligned
Currency display has small left-aligned $ with large centered amount.
**Effort:** 10 min — align and size consistently.

### 18. Modal overlay no visual close hint
Tapping backdrop closes modal but there's no indication this works.
**Effort:** 5 min — add subtle animation or hint.

### 19. Skeleton coverage gaps
No skeleton for form fields or category picker.
**Effort:** 30 min — add skeleton variants.

### 20. AssignIncomeModal scrollability not obvious
No indicator that the category list is scrollable.
**Effort:** 10 min — add scroll indicator or gradient fade.

## P3 — Nice-to-have

### 21. ProgressBar could animate width changes
**Effort:** 15 min with react-native-reanimated.

### 22. Toast swipe-to-dismiss
**Effort:** 30 min — add PanGestureHandler.

### 23. Button loading animation
Spinner exists but no pulse/shimmer effect.
**Effort:** 20 min.

### 24. HouseholdActivity no pagination
Hard-limited to 50 transactions with no "load more".
**Effort:** 45 min.

### 25. TransactionItem swipe hint
No visual affordance that items are swipeable.
**Effort:** 15 min — add subtle arrow or handle.

### 26. MemberCard role color legend
Different colors for roles but no explanation.
**Effort:** 10 min.

### 27. Icon fallback inconsistency
TransactionItem and HouseholdActivity use different fallback icons for missing category icons.
**Effort:** 10 min — standardize to shared constant.

---

**Summary:** 4 P0, 6 P1, 10 P2, 7 P3 = **27 issues total**
