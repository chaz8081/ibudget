import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useCategories } from "@/features/budget/hooks/useCategories";
import { useTransactions, type TransactionRow } from "@/features/transactions/hooks/useTransactions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/forms/CurrencyInput";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { Pressable } from "react-native";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";

export default function TransactionDetailScreen() {
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { categories } = useCategories(householdId);
  const { updateTransaction, deleteTransaction } = useTransactions({
    householdId,
  });

  const { data: txData } = useQuery<TransactionRow>(
    id && user?.id
      ? `SELECT t.*, c.name as category_name, c.icon as category_icon
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.id = ? AND t.user_id = ?`
      : "SELECT 1 WHERE 0",
    id && user?.id ? [id, user.id] : []
  );

  const transaction = txData?.[0];

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [txDate, setTxDate] = useState("");

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setPayee(transaction.payee ?? "");
      setAmount(transaction.amount);
      setSelectedCategory(transaction.category_id ?? "");
      setTxDate(transaction.transaction_date);
    }
  }, [transaction]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    try {
      await updateTransaction(id, {
        description,
        payee,
        amount,
        categoryId: selectedCategory,
        transactionDate: txDate,
      });
      setIsEditing(false);
      showToast("Transaction updated");
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    }
  }, [id, description, payee, amount, selectedCategory, txDate, updateTransaction, showToast]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            await deleteTransaction(id);
            router.back();
          },
        },
      ]
    );
  }, [id, deleteTransaction, router]);

  if (!transaction) {
    return <SkeletonDetail />;
  }

  if (isEditing) {
    return (
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4" keyboardShouldPersistTaps="handled">
        <CurrencyInput label="Amount" value={amount} onChangeValue={setAmount} />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
        />
        <Input label="Payee" value={payee} onChangeText={setPayee} />
        <DatePicker label="Date" value={txDate} onChange={setTxDate} />

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3 py-1.5 border ${
                selectedCategory === cat.id
                  ? "bg-primary-600 border-primary-600"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500"
              }`}
            >
              <Text
                className={`text-sm ${
                  selectedCategory === cat.id ? "text-white" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button title="Save" onPress={handleSave} />
        <View className="h-3" />
        <Button
          title="Cancel"
          variant="ghost"
          onPress={() => setIsEditing(false)}
        />
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4">
      <Card className="mb-4">
        <View className="items-center mb-4">
          <Text
            className={`text-3xl font-bold ${
              transaction.transaction_type === "income"
                ? "text-success-500"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {transaction.transaction_type === "income" ? "+" : "-"}
            {formatCents(transaction.amount)}
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Description</Text>
            <Text className="text-sm text-gray-900 dark:text-gray-100">{transaction.description}</Text>
          </View>
          {transaction.payee && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500 dark:text-gray-400">Payee</Text>
              <Text className="text-sm text-gray-900 dark:text-gray-100">{transaction.payee}</Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Category</Text>
            <Text className="text-sm text-gray-900 dark:text-gray-100">
              {transaction.category_icon ?? ""} {transaction.category_name ?? "Uncategorized"}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Date</Text>
            <Text className="text-sm text-gray-900 dark:text-gray-100">{transaction.transaction_date}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500 dark:text-gray-400">Type</Text>
            <Text className="text-sm text-gray-900 dark:text-gray-100 capitalize">
              {transaction.transaction_type}
            </Text>
          </View>
        </View>
      </Card>

      <Button title="Edit" variant="secondary" onPress={() => setIsEditing(true)} />
      <View className="h-3" />
      <Button title="Delete" variant="danger" onPress={handleDelete} />
    </View>
  );
}
