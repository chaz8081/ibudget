import { View, Text, Pressable, Platform } from "react-native";
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
      accessibilityRole="button"
      accessibilityLabel="Delete transaction"
      className="bg-danger-500 hover:bg-danger-400 items-center justify-center px-6"
      style={Platform.OS === "web" ? ({ cursor: "pointer" } as never) : undefined}
    >
      <Text className="text-white font-semibold text-sm">Delete</Text>
    </Pressable>
  );
}

export function TransactionItem({ transaction, onPress, onDelete }: TransactionItemProps) {
  const isIncome = transaction.transaction_type === "income";

  const displayName = transaction.payee || transaction.description;
  const amountText = `${isIncome ? "+" : "-"}${formatCents(transaction.amount)}`;
  const dateText = formatTransactionDate(transaction.transaction_date);

  const content = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, ${amountText}, ${dateText}${transaction.category_name ? `, ${transaction.category_name}` : ""}`}
      className="flex-row items-center py-3 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        ...(Platform.OS === "web" ? { cursor: "pointer" as never } : {}),
      })}
    >
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
    if (Platform.OS === "web") {
      return (
        <View className="flex-row items-center bg-white dark:bg-gray-800">
          <View className="flex-1">{content}</View>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete transaction"
            className="px-3 py-2 mr-2 rounded-lg"
            style={{ cursor: "pointer" } as never}
          >
            <Text className="text-danger-500 text-sm font-semibold">Delete</Text>
          </Pressable>
        </View>
      );
    }
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
