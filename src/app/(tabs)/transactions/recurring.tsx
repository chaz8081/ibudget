import { useCallback } from "react";
import { View, Text, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useRecurringTransactions } from "@/features/transactions/hooks/useRecurringTransactions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCents } from "@/utils/currency";
import { useToast } from "@/contexts/ToastContext";

export default function RecurringTransactionsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { householdId } = useHousehold();
  const { recurringTransactions, toggleEnabled, deleteRecurring } =
    useRecurringTransactions(householdId);

  const handleToggle = useCallback((id: string, val: boolean) => {
    toggleEnabled(id, val);
    showToast(val ? "Recurring enabled" : "Recurring paused");
  }, [toggleEnabled, showToast]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Recurring Transaction",
      "Are you sure you want to delete this recurring transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRecurring(id);
            showToast("Recurring transaction deleted");
          },
        },
      ]
    );
  };

  if (!householdId) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center px-6">
        <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No household yet</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">Create or join a household from the Dashboard to set up recurring transactions.</Text>
        <Button title="Go to Dashboard" onPress={() => router.replace("/(tabs)/dashboard")} />
      </View>
    );
  }

  if (recurringTransactions.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        <EmptyState
          icon="🔄"
          title="No Recurring Transactions"
          message="Set up recurring transactions when adding a new transaction"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4">
      {recurringTransactions.map((rt) => (
        <Card key={rt.id} className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <View className="flex-row items-center">
                {rt.category_icon && (
                  <Text className="text-base mr-2">{rt.category_icon}</Text>
                )}
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {rt.payee || rt.description}
                </Text>
              </View>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {rt.recurrenceDescription ?? rt.frequency}
                {" \u00B7 "}
                Next: {rt.next_occurrence_date}
              </Text>
            </View>
            <Text
              className={`text-base font-semibold mr-3 ${
                rt.transaction_type === "income"
                  ? "text-success-500"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {rt.transaction_type === "income" ? "+" : "-"}
              {formatCents(rt.amount)}
            </Text>
            <Switch
              value={rt.is_enabled === 1}
              onValueChange={(val) => handleToggle(rt.id, val)}
            />
          </View>
          <Button
            title="Delete"
            variant="ghost"
            onPress={() => handleDelete(rt.id)}
          />
        </Card>
      ))}
    </View>
  );
}
