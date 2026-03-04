import { useState, useEffect, useCallback } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useBudget } from "@/features/budget/hooks/useBudget";
import { useEnvelopes } from "@/features/budget/hooks/useEnvelopes";
import { useAssignIncome } from "@/features/budget/hooks/useAssignIncome";
import { useCategories } from "@/features/budget/hooks/useCategories";
import { getPreviousMonth, getNextMonth } from "@/utils/date";
import { SetupHousehold } from "@/components/household/SetupHousehold";
import { MonthPicker } from "@/components/budget/MonthPicker";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { EnvelopeList } from "@/components/budget/EnvelopeList";
import { AssignIncomeModal } from "@/components/budget/AssignIncomeModal";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/forms/CurrencyInput";
import { Modal } from "@/components/ui/Modal";
import { getErrorMessage } from "@/utils/errors";

export default function DashboardScreen() {
  useProfile(); // Ensure profile exists
  const { household, householdId, isLoading: householdLoading } = useHousehold();
  const { seedDefaultCategories } = useCategories(householdId);

  const [monthState, setMonthState] = useState<{
    month: number;
    year: number;
  }>(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const { budget, getOrCreateBudget, updateIncome, month, year } = useBudget(
    monthState.month,
    monthState.year
  );
  const { envelopes, updateAllocation } = useEnvelopes(
    budget?.id ?? null,
    householdId
  );
  const { totalAllocated, totalSpent, unassigned } = useAssignIncome(
    budget?.total_income ?? 0,
    envelopes
  );

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [incomeValue, setIncomeValue] = useState(0);

  // Auto-create budget when household exists
  useEffect(() => {
    if (householdId && !budget) {
      getOrCreateBudget(householdId);
    }
  }, [householdId, budget, getOrCreateBudget]);

  // Seed default categories when household is first created
  useEffect(() => {
    if (householdId) {
      seedDefaultCategories();
    }
  }, [householdId, seedDefaultCategories]);

  const handlePrevMonth = useCallback(() => {
    setMonthState((prev) => getPreviousMonth(prev.month, prev.year));
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonthState((prev) => getNextMonth(prev.month, prev.year));
  }, []);

  const handleSetIncome = useCallback(() => {
    setIncomeValue(budget?.total_income ?? 0);
    setShowIncomeModal(true);
  }, [budget?.total_income]);

  const handleSaveIncome = useCallback(async () => {
    try {
      await updateIncome(incomeValue);
      setShowIncomeModal(false);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    }
  }, [incomeValue, updateIncome]);

  const handleSaveAllocations = useCallback(
    async (allocations: { categoryId: string; amount: number }[]) => {
      try {
        for (const { categoryId, amount } of allocations) {
          await updateAllocation(categoryId, amount);
        }
      } catch (error) {
        Alert.alert("Error", getErrorMessage(error));
      }
    },
    [updateAllocation]
  );

  if (householdLoading) return null;
  if (!household) return <SetupHousehold />;

  return (
    <View className="flex-1 bg-gray-50">
      <MonthPicker
        month={month}
        year={year}
        onPrevious={handlePrevMonth}
        onNext={handleNextMonth}
      />

      <BudgetSummary
        totalIncome={budget?.total_income ?? 0}
        totalAllocated={totalAllocated}
        totalSpent={totalSpent}
        unassigned={unassigned}
      />

      <View className="flex-row px-4 mb-4 gap-2">
        <View className="flex-1">
          <Button
            title="Set Income"
            variant="secondary"
            onPress={handleSetIncome}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Assign"
            variant="primary"
            onPress={() => setShowAssignModal(true)}
          />
        </View>
      </View>

      <EnvelopeList envelopes={envelopes} />

      <Modal
        visible={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        title="Set Monthly Income"
      >
        <View className="px-6 py-4">
          <CurrencyInput
            label="Total Income"
            value={incomeValue}
            onChangeValue={setIncomeValue}
          />
          <Button title="Save" onPress={handleSaveIncome} />
        </View>
      </Modal>

      <AssignIncomeModal
        visible={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        envelopes={envelopes}
        totalIncome={budget?.total_income ?? 0}
        onSave={handleSaveAllocations}
      />
    </View>
  );
}
