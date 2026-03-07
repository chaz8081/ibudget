import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, Switch } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { Modal } from "@/components/ui/Modal";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { CurrencyInput } from "@/components/forms/CurrencyInput";
import { FormField } from "@/components/forms/FormField";
import { parseCurrencyInput } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { useToast } from "@/contexts/ToastContext";
import type { Frequency } from "@/features/transactions/utils/recurring-engine";

const transactionSchema = z.object({
  description: z.string(),
  payee: z.string().optional(),
  txDate: z.string().min(1, "Date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

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
  const { control, handleSubmit, reset, watch, formState: { isDirty } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    defaultValues: {
      description: "",
      payee: "",
      txDate: new Date().toISOString().split("T")[0],
      endDate: "",
      notes: "",
    },
  });
  const [amount, setAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const watchedTxDate = watch("txDate");

  const hasUnsavedChanges = isDirty || amount !== 0 || selectedCategory !== "" || txType !== "expense" || isRecurring;

  const resetForm = useCallback(() => {
    setAmount(0);
    setSelectedCategory("");
    setTxType("expense");
    setIsRecurring(false);
    setFrequency("monthly");
    setShowCategoryPicker(false);
    reset({
      description: "",
      payee: "",
      txDate: new Date().toISOString().split("T")[0],
      endDate: "",
      notes: "",
    });
  }, [reset]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, resetForm, onClose]);

  const onSubmit = handleSubmit(async (data) => {
    if (amount === 0) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setIsLoading(true);
    try {
      const resolvedDescription =
        data.description?.trim() ||
        categories.find((c) => c.id === selectedCategory)?.name ||
        "Transaction";

      // Save the one-time transaction
      await onSave({
        description: resolvedDescription,
        payee: data.payee?.trim() || undefined,
        amount,
        categoryId: selectedCategory,
        transactionType: txType,
        transactionDate: data.txDate,
        notes: data.notes?.trim() || undefined,
      });

      // Also create recurring if toggled on
      if (isRecurring && onSaveRecurring) {
        await onSaveRecurring({
          description: resolvedDescription,
          payee: data.payee?.trim() || undefined,
          amount,
          categoryId: selectedCategory,
          transactionType: txType,
          frequency,
          startDate: data.txDate,
          endDate: data.endDate?.trim() || undefined,
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
  });

  return (
    <Modal visible={visible} onClose={handleClose} title="Add Transaction" fullScreen>
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

        <FormField
          control={control}
          name="description"
          label="Description (optional)"
          placeholder="Description (optional)"
        />

        <FormField
          control={control}
          name="payee"
          label="Payee (optional)"
          placeholder="Who did you pay?"
        />

        <Controller
          control={control}
          name="txDate"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <DatePicker label="Date" value={value} onChange={onChange} error={error?.message} />
          )}
        />

        {/* Category picker */}
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
          categories={categories}
          selectedId={selectedCategory}
          onSelect={(id) => setSelectedCategory(id ?? "")}
        />

        <FormField
          control={control}
          name="notes"
          label="Notes (optional)"
          placeholder="Any additional details..."
          multiline
          numberOfLines={3}
        />

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
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <DatePicker
                      label="End Date (optional)"
                      value={value ?? ""}
                      onChange={onChange}
                      minDate={watchedTxDate}
                      error={error?.message}
                    />
                  )}
                />
              </View>
            )}
          </View>
        )}

        <Button title="Save Transaction" onPress={onSubmit} isLoading={isLoading} />
        <View className="h-8" />
      </ScrollView>
    </Modal>
  );
}
