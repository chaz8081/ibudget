import { View, Text, Pressable } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { formatCents } from "@/utils/currency";
import { formatTransactionDate } from "@/utils/date";
import type { TransactionRow } from "@/features/transactions/hooks/useTransactions";

type TransactionItemProps = {
  transaction: TransactionRow;
  onPress?: () => void;
  onDelete?: () => void;
};

function DeleteAction({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-danger-500 items-center justify-center px-6"
    >
      <Text className="text-white font-semibold text-sm">Delete</Text>
    </Pressable>
  );
}

export function TransactionItem({ transaction, onPress, onDelete }: TransactionItemProps) {
  const isIncome = transaction.transaction_type === "income";

  const content = (
    <Pressable onPress={onPress} className="flex-row items-center py-3 px-4 bg-white dark:bg-gray-800">
      {transaction.category_icon ? (
        <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
          <Text className="text-base">{transaction.category_icon}</Text>
        </View>
      ) : (
        <View className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
          <Text className="text-xs text-gray-400">$</Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
          {transaction.payee || transaction.description}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {formatTransactionDate(transaction.transaction_date)}
          {transaction.category_name ? ` \u00B7 ${transaction.category_name}` : ""}
        </Text>
      </View>
      <Text
        className={`text-base font-semibold ${
          isIncome ? "text-success-500" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {isIncome ? "+" : "-"}{formatCents(transaction.amount)}
      </Text>
    </Pressable>
  );

  if (onDelete) {
    return (
      <Swipeable
        renderRightActions={() => <DeleteAction onPress={onDelete} />}
        overshootRight={false}
      >
        {content}
      </Swipeable>
    );
  }

  return content;
}
