import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useBudget } from "@/features/budget/hooks/useBudget";
import { useCategories } from "@/features/budget/hooks/useCategories";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { Button } from "@/components/ui/Button";

export default function TransactionsScreen() {
  const router = useRouter();
  const { householdId } = useHousehold();
  const { budget } = useBudget();
  const { categories } = useCategories(householdId);
  const { transactions, addTransaction } = useTransactions({
    householdId,
    budgetId: budget?.id,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredTransactions = filterCategory
    ? transactions.filter((t) => t.category_id === filterCategory)
    : transactions;

  const handleSave = useCallback(
    async (data: {
      description: string;
      payee?: string;
      amount: number;
      categoryId: string;
      transactionType: string;
      transactionDate: string;
      notes?: string;
    }) => {
      if (!householdId) return;
      await addTransaction({ ...data, householdId });
    },
    [addTransaction, householdId]
  );

  if (!householdId) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Set up a household first</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Category filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, name: "All", icon: null }, ...categories]}
        keyExtractor={(item) => item.id ?? "all"}
        contentContainerClassName="px-4 py-3"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilterCategory(item.id)}
            className={`rounded-full px-3 py-1.5 mr-2 border ${
              filterCategory === item.id
                ? "bg-primary-600 border-primary-600"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-sm ${
                filterCategory === item.id ? "text-white" : "text-gray-700"
              }`}
            >
              {item.icon ? `${item.icon} ` : ""}{item.name}
            </Text>
          </Pressable>
        )}
      />

      {filteredTransactions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-base mb-4">
            No transactions yet
          </Text>
          <Button
            title="Add Your First Transaction"
            onPress={() => setShowAdd(true)}
          />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4"
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() =>
                router.push(`/(tabs)/transactions/${item.id}`)
              }
            />
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => setShowAdd(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </Pressable>

      <AddTransactionSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        categories={categories}
        onSave={handleSave}
      />
    </View>
  );
}
