import { useState, useCallback } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useBudget } from "@/features/budget/hooks/useBudget";
import { useEnvelopes } from "@/features/budget/hooks/useEnvelopes";
import { useCategories } from "@/features/budget/hooks/useCategories";
import { EnvelopeList } from "@/components/budget/EnvelopeList";
import { MonthPicker } from "@/components/budget/MonthPicker";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { getPreviousMonth, getNextMonth } from "@/utils/date";
import { CATEGORY_GROUPS } from "@/features/budget/schemas/envelope.schema";
import { getErrorMessage } from "@/utils/errors";
import { PageContainer } from "@/components/ui/PageContainer";
import { useToast } from "@/contexts/ToastContext";
import type { EnvelopeWithBalance } from "@/features/budget/utils/budget-calculations";

export default function EnvelopesScreen() {
  const { showToast } = useToast();
  const router = useRouter();
  const { householdId } = useHousehold();

  const [monthState, setMonthState] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const { budget, month, year } = useBudget(monthState.month, monthState.year);
  const { envelopes } = useEnvelopes(budget?.id ?? null, householdId);
  const { addCategory } = useCategories(householdId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("other");

  const handleEnvelopePress = useCallback(
    (envelope: EnvelopeWithBalance) => {
      router.push(`/(tabs)/envelopes/${envelope.id}`);
    },
    [router]
  );

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory(newCategoryName.trim(), selectedGroup);
      setNewCategoryName("");
      setShowAddModal(false);
      showToast("Category added");
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    }
  }, [newCategoryName, selectedGroup, addCategory, showToast]);

  if (!householdId) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No household yet</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">Create or join a household from the Dashboard to start budgeting.</Text>
        <Button title="Go to Dashboard" onPress={() => router.replace("/(tabs)/dashboard")} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <PageContainer>
      <MonthPicker
        month={month}
        year={year}
        onPrevious={() =>
          setMonthState((p) => getPreviousMonth(p.month, p.year))
        }
        onNext={() => setMonthState((p) => getNextMonth(p.month, p.year))}
      />

      <View className="px-4 mb-4">
        <Button
          title="+ Add Category"
          variant="secondary"
          onPress={() => setShowAddModal(true)}
        />
      </View>

      <EnvelopeList
        envelopes={envelopes}
        onEnvelopePress={handleEnvelopePress}
        onAddCategory={() => setShowAddModal(true)}
      />

      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Category"
      >
        <View className="px-6 py-4">
          <Input
            label="Category Name"
            placeholder="e.g., Coffee"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            autoFocus
          />
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORY_GROUPS.map((g) => (
              <View
                key={g.value}
                className={`rounded-full px-3 py-1.5 border ${
                  selectedGroup === g.value
                    ? "bg-primary-600 border-primary-600"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500"
                }`}
              >
                <Text
                  onPress={() => setSelectedGroup(g.value)}
                  className={`text-sm ${
                    selectedGroup === g.value ? "text-white" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {g.label}
                </Text>
              </View>
            ))}
          </View>
          <Button title="Add" onPress={handleAddCategory} />
        </View>
      </Modal>
      </PageContainer>
    </View>
  );
}
