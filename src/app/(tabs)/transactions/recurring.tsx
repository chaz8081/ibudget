import { View, Text, Switch, Alert } from "react-native";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useRecurringTransactions } from "@/features/transactions/hooks/useRecurringTransactions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/utils/currency";

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function RecurringTransactionsScreen() {
  const { householdId } = useHousehold();
  const { recurringTransactions, toggleEnabled, deleteRecurring } =
    useRecurringTransactions(householdId);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Recurring Transaction",
      "Are you sure you want to delete this recurring transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteRecurring(id),
        },
      ]
    );
  };

  if (!householdId) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <Text className="text-gray-500 dark:text-gray-400">Set up a household first</Text>
      </View>
    );
  }

  if (recurringTransactions.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center px-8">
        <Text className="text-5xl mb-4">{"🔄"}</Text>
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
          No Recurring Transactions
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center">
          Set up recurring transactions when adding a new transaction
        </Text>
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
                {FREQUENCY_LABELS[rt.frequency] ?? rt.frequency}
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
              onValueChange={(val) => toggleEnabled(rt.id, val)}
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
