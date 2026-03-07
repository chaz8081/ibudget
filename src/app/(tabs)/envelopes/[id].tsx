import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@powersync/react";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useBudget } from "@/features/budget/hooks/useBudget";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCents } from "@/utils/currency";
import { formatTransactionDate } from "@/utils/date";
import { SkeletonDetail } from "@/components/ui/Skeleton";

type TransactionRow = {
  id: string;
  description: string;
  payee: string | null;
  amount: number;
  transaction_date: string;
  transaction_type: string;
};

type CategoryInfo = {
  name: string;
  icon: string | null;
  allocated: number;
  spent: number;
};

export default function EnvelopeDetailScreen() {
  const { id: categoryId } = useLocalSearchParams<{ id: string }>();
  const { householdId } = useHousehold();
  const { budget } = useBudget();

  // Get category info + allocation
  const { data: categoryData } = useQuery<CategoryInfo>(
    budget?.id && categoryId
      ? `SELECT
           c.name,
           c.icon,
           COALESCE(ea.allocated_amount, 0) AS allocated,
           COALESCE(
             (SELECT SUM(amount) FROM transactions
              WHERE category_id = c.id AND budget_id = ? AND transaction_type = 'expense'),
             0
           ) AS spent
         FROM categories c
         LEFT JOIN envelope_allocations ea ON ea.category_id = c.id AND ea.budget_id = ?
         WHERE c.id = ?`
      : "SELECT 1 WHERE 0",
    budget?.id && categoryId ? [budget.id, budget.id, categoryId] : []
  );

  const category = categoryData?.[0];

  // Get transactions for this category in the current budget
  const { data: transactions } = useQuery<TransactionRow>(
    budget?.id && categoryId
      ? `SELECT * FROM transactions
         WHERE category_id = ? AND budget_id = ?
         ORDER BY transaction_date DESC, created_at DESC`
      : "SELECT 1 WHERE 0",
    budget?.id && categoryId ? [categoryId, budget.id] : []
  );

  if (!category) {
    return <SkeletonDetail />;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Card className="mx-4 mt-4 mb-4">
        <View className="flex-row items-center mb-2">
          {category.icon && (
            <Text className="text-2xl mr-2">{category.icon}</Text>
          )}
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {category.name}
          </Text>
        </View>

        <ProgressBar allocated={category.allocated} spent={category.spent} />

        <View className="flex-row justify-between mt-3">
          <View>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Spent</Text>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {formatCents(category.spent)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Budgeted</Text>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {formatCents(category.allocated)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Remaining</Text>
            <Text
              className={`text-base font-semibold ${
                category.allocated - category.spent < 0
                  ? "text-danger-500"
                  : "text-success-500"
              }`}
            >
              {formatCents(category.allocated - category.spent)}
            </Text>
          </View>
        </View>
      </Card>

      <Text className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Transactions
      </Text>

      {(transactions ?? []).length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-gray-400 dark:text-gray-500">No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4"
          renderItem={({ item }) => (
            <Card className="mb-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {item.payee || item.description || "Transaction"}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTransactionDate(item.transaction_date)}
                  </Text>
                </View>
                <Text
                  className={`text-base font-semibold ${
                    item.transaction_type === "income"
                      ? "text-success-500"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {item.transaction_type === "income" ? "+" : "-"}
                  {formatCents(item.amount)}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
