import { View, Text, Pressable } from "react-native";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/utils/currency";
import { formatTransactionDate } from "@/utils/date";
import type { TransactionRow } from "@/features/transactions/hooks/useTransactions";

type TransactionItemProps = {
  transaction: TransactionRow;
  onPress?: () => void;
};

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const isIncome = transaction.transaction_type === "income";

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-2">
        <View className="flex-row items-center">
          {transaction.category_icon && (
            <Text className="text-lg mr-3">{transaction.category_icon}</Text>
          )}
          <View className="flex-1">
            <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
              {transaction.payee || transaction.description}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-gray-500">
                {formatTransactionDate(transaction.transaction_date)}
              </Text>
              {transaction.category_name && (
                <View className="bg-gray-100 rounded-full px-2 py-0.5">
                  <Text className="text-xs text-gray-600">
                    {transaction.category_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text
            className={`text-base font-semibold ${
              isIncome ? "text-success-500" : "text-gray-900"
            }`}
          >
            {isIncome ? "+" : "-"}{formatCents(transaction.amount)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
