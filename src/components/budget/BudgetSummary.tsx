import { View, Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/utils/currency";

type BudgetSummaryProps = {
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  unassigned: number;
};

export function BudgetSummary({
  totalIncome,
  totalAllocated,
  totalSpent,
  unassigned,
}: BudgetSummaryProps) {
  return (
    <Card className="mx-4 mb-4">
      <View className="flex-row justify-between mb-3">
        <View className="flex-1">
          <Text className="text-sm text-gray-500">Income</Text>
          <Text className="text-xl font-bold text-gray-900">
            {formatCents(totalIncome)}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-sm text-gray-500">Spent</Text>
          <Text className="text-xl font-bold text-gray-900">
            {formatCents(totalSpent)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between pt-3 border-t border-gray-100">
        <View className="flex-1">
          <Text className="text-sm text-gray-500">Budgeted</Text>
          <Text className="text-base font-semibold text-gray-700">
            {formatCents(totalAllocated)}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-sm text-gray-500">Unassigned</Text>
          <Text
            className={`text-base font-semibold ${
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
    </Card>
  );
}
