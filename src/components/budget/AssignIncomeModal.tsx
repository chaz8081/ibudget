import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { CurrencyInput } from "@/components/forms/CurrencyInput";
import { formatCents } from "@/utils/currency";
import { showAlert } from "@/utils/confirm";
import type { EnvelopeWithBalance } from "@/features/budget/utils/budget-calculations";

type AssignIncomeModalProps = {
  visible: boolean;
  onClose: () => void;
  envelopes: EnvelopeWithBalance[];
  totalIncome: number;
  onSave: (allocations: { categoryId: string; amount: number }[]) => void;
};

export function AssignIncomeModal({
  visible,
  onClose,
  envelopes,
  totalIncome,
  onSave,
}: AssignIncomeModalProps) {
  const [initialAllocations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    envelopes.forEach((e) => {
      initial[e.id] = e.allocated;
    });
    return initial;
  });

  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    envelopes.forEach((e) => {
      initial[e.id] = e.allocated;
    });
    return initial;
  });

  const isDirty = Object.keys(allocations).some(
    (key) => allocations[key] !== (initialAllocations[key] ?? 0)
  );

  const handleClose = useCallback(() => {
    if (isDirty) {
      showAlert(
        "Discard Changes?",
        "You have unsaved allocation changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const totalAllocated = Object.values(allocations).reduce(
    (sum, v) => sum + v,
    0
  );
  const unassigned = totalIncome - totalAllocated;

  const handleChange = useCallback((categoryId: string, amount: number) => {
    setAllocations((prev) => ({ ...prev, [categoryId]: amount }));
  }, []);

  const handleSave = useCallback(() => {
    const result = Object.entries(allocations).map(([categoryId, amount]) => ({
      categoryId,
      amount,
    }));
    onSave(result);
    onClose();
  }, [allocations, onSave, onClose]);

  return (
    <Modal visible={visible} onClose={handleClose} title="Assign Income" actionLabel="Save" onAction={handleSave}>
      <View className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row justify-between">
          <Text className="text-sm text-gray-500 dark:text-gray-400">Income</Text>
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCents(totalIncome)}
          </Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-sm text-gray-500 dark:text-gray-400">Unassigned</Text>
          <Text
            className={`text-sm font-semibold ${
              unassigned < 0
                ? "text-danger-500"
                : unassigned === 0
                  ? "text-success-500"
                  : "text-warning-500"
            }`}
          >
            {formatCents(unassigned)}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4" keyboardShouldPersistTaps="handled">
        {envelopes.map((envelope) => (
          <View key={envelope.id} className="mb-4">
            <View className="flex-row items-center mb-1">
              {envelope.icon && (
                <Text className="text-sm mr-1">{envelope.icon}</Text>
              )}
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {envelope.name}
              </Text>
            </View>
            <CurrencyInput
              value={allocations[envelope.id] ?? 0}
              onChangeValue={(amount) => handleChange(envelope.id, amount)}
            />
          </View>
        ))}
        <View className="h-8" />
      </ScrollView>
    </Modal>
  );
}
