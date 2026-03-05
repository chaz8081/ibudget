import { View, Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCents } from "@/utils/currency";

type MemberBudget = {
  user_id: string;
  display_name: string;
  total_income: number;
  total_allocated: number;
  total_spent: number;
};

type CategoryBreakdownItem = {
  category_id: string;
  category_name: string;
  category_icon: string | null;
  total_allocated: number;
  total_spent: number;
};

type HouseholdSummaryProps = {
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  memberCount: number;
  memberBudgets: MemberBudget[];
  categoryBreakdown: CategoryBreakdownItem[];
};

export function HouseholdSummary({
  totalIncome,
  totalAllocated,
  totalSpent,
  memberCount,
  memberBudgets,
  categoryBreakdown,
}: HouseholdSummaryProps) {
  const totalRemaining = totalIncome - totalSpent;

  return (
    <View>
      {/* Overall summary */}
      <Card className="mx-4 mb-4">
        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Household Total ({memberCount} {memberCount === 1 ? "member" : "members"})
        </Text>
        <View className="flex-row justify-between mb-2">
          <View>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Combined Income</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCents(totalIncome)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Total Spent</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCents(totalSpent)}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <View>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Budgeted</Text>
            <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">{formatCents(totalAllocated)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Remaining</Text>
            <Text
              className={`text-base font-semibold ${
                totalRemaining < 0 ? "text-danger-500" : "text-success-500"
              }`}
            >
              {formatCents(totalRemaining)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Per-member breakdown */}
      {memberBudgets.length > 1 && (
        <View className="mx-4 mb-4">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            By Member
          </Text>
          {memberBudgets.map((member) => (
            <Card key={member.user_id} className="mb-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {member.display_name}
                </Text>
                <View className="items-end">
                  <Text className="text-sm text-gray-900 dark:text-gray-100">
                    {formatCents(member.total_spent)} / {formatCents(member.total_income)}
                  </Text>
                </View>
              </View>
              <View className="mt-2">
                <ProgressBar
                  allocated={member.total_income}
                  spent={member.total_spent}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Per-category breakdown */}
      {categoryBreakdown.length > 0 && (
        <View className="mx-4 mb-4">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            By Category
          </Text>
          {categoryBreakdown.map((cat) => (
            <Card key={cat.category_id} className="mb-2">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {cat.category_icon ? `${cat.category_icon} ` : ""}{cat.category_name}
                </Text>
                <Text className="text-sm text-gray-700 dark:text-gray-300">
                  {formatCents(cat.total_spent)} / {formatCents(cat.total_allocated)}
                </Text>
              </View>
              <ProgressBar
                allocated={cat.total_allocated}
                spent={cat.total_spent}
              />
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}
