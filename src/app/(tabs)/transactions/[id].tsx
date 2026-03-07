import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@powersync/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useCategories } from "@/features/budget/hooks/useCategories";
import { useTransactions, type TransactionRow } from "@/features/transactions/hooks/useTransactions";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/forms/CurrencyInput";
import { FormField } from "@/components/forms/FormField";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { getTransactionLabels } from "@/utils/transaction-labels";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";

const editTransactionSchema = z.object({
  description: z.string(),
  payee: z.string().optional(),
  txDate: z.string().min(1, "Date is required"),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

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
  const [amount, setAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { control, handleSubmit, reset } = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
    mode: "onBlur",
    defaultValues: {
      description: "",
      payee: "",
      txDate: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      reset({
        description: transaction.description,
        payee: transaction.payee ?? "",
        txDate: transaction.transaction_date,
      });
      setAmount(transaction.amount);
      setSelectedCategory(transaction.category_id ?? "");
    }
  }, [transaction, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!id) return;
    try {
      const resolvedDescription =
        data.description?.trim() ||
        categories.find((c) => c.id === selectedCategory)?.name ||
        "Transaction";

      await updateTransaction(id, {
        description: resolvedDescription,
        payee: data.payee ?? "",
        amount,
        categoryId: selectedCategory,
        transactionDate: data.txDate,
      });
      setIsEditing(false);
      showToast("Transaction updated");
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    }
  });

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

  const isExpense = transaction.transaction_type !== "income";
  const labels = getTransactionLabels(isExpense);
  const filteredCategories = categories.filter((c) =>
    isExpense ? c.category_group !== "income" : c.category_group === "income" || c.category_group === "other"
  );

  if (isEditing) {
    return (
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4" keyboardShouldPersistTaps="handled">
        <CurrencyInput label="Amount" value={amount} onChangeValue={setAmount} />
        <FormField
          control={control}
          name="payee"
          label={labels.entityLabel}
          placeholder={labels.entityPlaceholder}
        />
        <FormField
          control={control}
          name="description"
          label="Description (optional)"
          placeholder={labels.descriptionPlaceholder}
        />
        <Controller
          control={control}
          name="txDate"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <DatePicker label="Date" value={value} onChange={onChange} error={error?.message} />
          )}
        />

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</Text>
        <Pressable
          onPress={() => setShowCategoryPicker(true)}
          className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-500 mb-4"
        >
          <Text className={`flex-1 text-base ${selectedCategory ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
            {selectedCategory
              ? `${categories.find((c) => c.id === selectedCategory)?.icon ?? ""} ${categories.find((c) => c.id === selectedCategory)?.name ?? ""}`.trim()
              : "Select a category"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9ca3af" />
        </Pressable>

        <CategoryPicker
          visible={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          categories={filteredCategories}
          selectedId={selectedCategory}
          onSelect={(id) => setSelectedCategory(id ?? "")}
        />

        <Button title="Save" onPress={onSubmit} />
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
              <Text className="text-sm text-gray-500 dark:text-gray-400">{isExpense ? "Payee" : "Source"}</Text>
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
