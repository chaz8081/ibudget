import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useBudget } from "@/features/budget/hooks/useBudget";
import { useCategories } from "@/features/budget/hooks/useCategories";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import { useRecurringTransactions } from "@/features/transactions/hooks/useRecurringTransactions";
import type { Frequency } from "@/features/transactions/utils/recurring-engine";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import * as Storage from "@/utils/storage";
import { useToast } from "@/contexts/ToastContext";

export default function TransactionsScreen() {
  const { showToast } = useToast();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { householdId } = useHousehold();
  const { budget } = useBudget();
  const { categories } = useCategories(householdId);
  const { transactions, addTransaction, deleteTransaction } = useTransactions({
    householdId,
    budgetId: budget?.id,
  });
  const { addRecurring } = useRecurringTransactions(householdId);

  const [showAdd, setShowAdd] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    Storage.getItem("swipe_hint_dismissed").then((val) => {
      if (val !== "true") setShowSwipeHint(true);
    });
  }, []);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    Storage.setItem("swipe_hint_dismissed", "true");
  }, []);

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (filterCategory) {
      result = result.filter((t) => t.category_id === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.payee?.toLowerCase().includes(q) ||
          t.category_name?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [transactions, filterCategory, searchQuery]);

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

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "Delete Transaction",
        "Are you sure you want to delete this transaction?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteTransaction(id);
              dismissSwipeHint();
              showToast("Transaction deleted");
            },
          },
        ]
      );
    },
    [deleteTransaction, dismissSwipeHint, showToast]
  );

  const handleSaveRecurring = useCallback(
    async (data: {
      description: string;
      payee?: string;
      amount: number;
      categoryId: string;
      transactionType: string;
      frequency: Frequency;
      startDate: string;
      endDate?: string;
    }) => {
      if (!householdId) return;
      await addRecurring({ ...data, householdId });
    },
    [addRecurring, householdId]
  );

  if (!householdId) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <Text className="text-gray-500 dark:text-gray-400">Set up a household first</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Search */}
      <View className="px-4 pt-2">
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Swipe-to-delete hint */}
      {showSwipeHint && (
        <View className="mx-4 mb-2 flex-row items-center bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3">
          <Ionicons name="information-circle-outline" size={20} color={isDark ? "#60a5fa" : "#2563eb"} />
          <Text className="flex-1 text-sm text-primary-700 dark:text-primary-300 ml-2">
            Swipe left on a transaction to delete it
          </Text>
          <Pressable onPress={dismissSwipeHint} className="p-1">
            <Ionicons name="close" size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
          </Pressable>
        </View>
      )}

      {/* Category filter dropdown */}
      <Pressable
        onPress={() => setShowCategoryFilter(true)}
        className="mx-4 mb-2 flex-row items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600"
      >
        <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">
          {filterCategory
            ? `${categories.find((c) => c.id === filterCategory)?.icon ?? ""} ${categories.find((c) => c.id === filterCategory)?.name ?? ""}`.trim()
            : "All Categories"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
      </Pressable>

      <CategoryPicker
        visible={showCategoryFilter}
        onClose={() => setShowCategoryFilter(false)}
        categories={categories}
        selectedId={filterCategory}
        onSelect={setFilterCategory}
        showAll
      />

      {filteredTransactions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 dark:text-gray-500 text-base mb-4">
            {searchQuery ? "No matching transactions" : "No transactions yet"}
          </Text>
          {!searchQuery && (
            <Button
              title="Add Your First Transaction"
              onPress={() => setShowAdd(true)}
            />
          )}
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-4 pb-4">
          <Card className="p-0 overflow-hidden">
            {filteredTransactions.map((item, index) => (
              <View key={item.id}>
                {index > 0 && (
                  <View className="border-b border-gray-100 dark:border-gray-700 ml-16" />
                )}
                <TransactionItem
                  transaction={item}
                  onPress={() =>
                    router.push(`/(tabs)/transactions/${item.id}`)
                  }
                  onDelete={() => handleDelete(item.id)}
                />
              </View>
            ))}
          </Card>
        </ScrollView>
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
        onSaveRecurring={handleSaveRecurring}
      />
    </View>
  );
}
