import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, Switch } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/forms/CurrencyInput";
import { parseCurrencyInput } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { useToast } from "@/contexts/ToastContext";
import type { Frequency } from "@/features/transactions/utils/recurring-engine";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type AddTransactionSheetProps = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (data: {
    description: string;
    payee?: string;
    amount: number;
    categoryId: string;
    transactionType: string;
    transactionDate: string;
    notes?: string;
  }) => Promise<void>;
  onSaveRecurring?: (data: {
    description: string;
    payee?: string;
    amount: number;
    categoryId: string;
    transactionType: string;
    frequency: Frequency;
    startDate: string;
    endDate?: string;
  }) => Promise<void>;
};

const FREQUENCIES: { label: string; value: Frequency }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Biweekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export function AddTransactionSheet({
  visible,
  onClose,
  categories,
  onSave,
  onSaveRecurring,
}: AddTransactionSheetProps) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [payee, setPayee] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txDate, setTxDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [endDate, setEndDate] = useState("");

  const resetForm = useCallback(() => {
    setAmount(0);
    setDescription("");
    setPayee("");
    setSelectedCategory("");
    setTxType("expense");
    setTxDate(new Date().toISOString().split("T")[0]);
    setIsRecurring(false);
    setFrequency("monthly");
    setEndDate("");
  }, []);

  const handleSave = useCallback(async () => {
    if (amount === 0) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    setIsLoading(true);
    try {
      // Save the one-time transaction
      await onSave({
        description: description.trim(),
        payee: payee.trim() || undefined,
        amount,
        categoryId: selectedCategory,
        transactionType: txType,
        transactionDate: txDate,
      });

      // Also create recurring if toggled on
      if (isRecurring && onSaveRecurring) {
        await onSaveRecurring({
          description: description.trim(),
          payee: payee.trim() || undefined,
          amount,
          categoryId: selectedCategory,
          transactionType: txType,
          frequency,
          startDate: txDate,
          endDate: endDate.trim() || undefined,
        });
      }

      showToast("Transaction created");
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [
    amount,
    description,
    payee,
    selectedCategory,
    txType,
    txDate,
    isRecurring,
    frequency,
    endDate,
    onSave,
    onSaveRecurring,
    onClose,
    resetForm,
    showToast,
  ]);

  return (
    <Modal visible={visible} onClose={onClose} title="Add Transaction">
      <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
        {/* Type toggle */}
        <View className="flex-row mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <Pressable
            onPress={() => setTxType("expense")}
            className={`flex-1 py-2 rounded-lg items-center ${
              txType === "expense" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
            }`}
          >
            <Text
              className={`font-semibold ${
                txType === "expense" ? "text-danger-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Expense
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTxType("income")}
            className={`flex-1 py-2 rounded-lg items-center ${
              txType === "income" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
            }`}
          >
            <Text
              className={`font-semibold ${
                txType === "income" ? "text-success-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Income
            </Text>
          </Pressable>
        </View>

        <CurrencyInput label="Amount" value={amount} onChangeValue={setAmount} />

        <Input
          label="Description"
          placeholder="What was this for?"
          value={description}
          onChangeText={setDescription}
        />

        <Input
          label="Payee (optional)"
          placeholder="Who did you pay?"
          value={payee}
          onChangeText={setPayee}
        />

        <DatePicker
          label="Date"
          value={txDate}
          onChange={setTxDate}
        />

        {/* Category picker */}
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

        {/* Recurring toggle */}
        {onSaveRecurring && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Make recurring
              </Text>
              <Switch value={isRecurring} onValueChange={setIsRecurring} />
            </View>

            {isRecurring && (
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {FREQUENCIES.map((f) => (
                    <Pressable
                      key={f.value}
                      onPress={() => setFrequency(f.value)}
                      className={`rounded-full px-3 py-1.5 border ${
                        frequency === f.value
                          ? "bg-primary-600 border-primary-600"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          frequency === f.value ? "text-white" : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <DatePicker
                  label="End Date (optional)"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={txDate}
                />
              </View>
            )}
          </View>
        )}

        <Button title="Save Transaction" onPress={handleSave} isLoading={isLoading} />
        <View className="h-8" />
      </ScrollView>
    </Modal>
  );
}
