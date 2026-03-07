import { View, Text } from "react-native";
import { useQuery } from "@powersync/react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCents } from "@/utils/currency";
import { formatTransactionDate } from "@/utils/date";

type ActivityTransaction = {
  id: string;
  description: string;
  payee: string | null;
  amount: number;
  transaction_date: string;
  transaction_type: string;
  display_name: string;
  category_name: string | null;
  category_icon: string | null;
};

type HouseholdActivityProps = {
  householdId: string | null;
  month: number;
  year: number;
};

export function HouseholdActivity({ householdId, month, year }: HouseholdActivityProps) {
  const { data: transactions } = useQuery<ActivityTransaction>(
    householdId
      ? `SELECT t.id, t.description, t.payee, t.amount, t.transaction_date,
                t.transaction_type, p.display_name,
                c.name as category_name, c.icon as category_icon
         FROM transactions t
         JOIN profiles p ON p.id = t.user_id
         LEFT JOIN categories c ON c.id = t.category_id
         JOIN budgets b ON b.id = t.budget_id
         WHERE t.household_id = ? AND b.month = ? AND b.year = ?
         ORDER BY t.transaction_date DESC, t.created_at DESC
         LIMIT 50`
      : "SELECT 1 WHERE 0",
    householdId ? [householdId, month, year] : []
  );

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No Activity Yet"
        message="Transactions from household members will appear here"
      />
    );
  }

  return (
    <Card className="mx-4 p-0 overflow-hidden">
      {transactions.map((tx, index) => {
        const isIncome = tx.transaction_type === "income";
        return (
          <View key={tx.id}>
            {index > 0 && (
              <View className="border-b border-gray-100 dark:border-gray-700 ml-16" />
            )}
            <View className="flex-row items-center py-3 px-4">
              {tx.category_icon ? (
                <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                  <Text className="text-base">{tx.category_icon}</Text>
                </View>
              ) : (
                <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                  <Text className="text-xs text-gray-400">$</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
                  {tx.payee || tx.description}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {tx.display_name} {"\u00B7"} {formatTransactionDate(tx.transaction_date)}
                </Text>
              </View>
              <Text
                className={`text-base font-semibold ${
                  isIncome ? "text-success-500" : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {isIncome ? "+" : "-"}{formatCents(tx.amount)}
              </Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
}
