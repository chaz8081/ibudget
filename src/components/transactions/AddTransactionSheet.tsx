import { useState, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Alert, Switch } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Modal } from "@/components/ui/Modal";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormField } from "@/components/forms/FormField";
import { parseCurrencyInput } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { useToast } from "@/contexts/ToastContext";
import { placeholderColor } from "@/constants/colors";
import { RecurrencePresetPicker } from "@/components/transactions/RecurrencePresetPicker";
import { CustomRecurrenceModal } from "@/components/transactions/CustomRecurrenceModal";
import { type RecurrenceRule } from "@/features/transactions/utils/recurrence-rule";

const transactionSchema = z.object({
  description: z.string(),
  payee: z.string().optional(),
  txDate: z.string().min(1, "Date is required"),
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
    recurrenceRule: RecurrenceRule;
    startDate: string;
  }) => Promise<void>;
};

export function AddTransactionSheet({
  visible,
  onClose,
  categories,
  onSave,
  onSaveRecurring,
}: AddTransactionSheetProps) {
  const { showToast } = useToast();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { control, handleSubmit, reset, watch, formState: { isDirty } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    defaultValues: {
      description: "",
      payee: "",
      txDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  const watchedTxDate = watch("txDate");

  const hasUnsavedChanges = isDirty || amount !== 0 || selectedCategory !== "" || txType !== "expense" || isRecurring || recurrenceRule !== null;

  const handleAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const formatted = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
    setDisplayAmount(formatted);
    setAmount(parseCurrencyInput(formatted));
  }, []);

  const handleAmountBlur = useCallback(() => {
    if (displayAmount) {
      const cents = parseCurrencyInput(displayAmount);
      setDisplayAmount((cents / 100).toFixed(2));
    }
  }, [displayAmount]);

  const resetForm = useCallback(() => {
    setAmount(0);
    setDisplayAmount("");
    setSelectedCategory("");
    setTxType("expense");
    setIsRecurring(false);
    setRecurrenceRule(null);
    setShowCustomRecurrence(false);
    setShowCategoryPicker(false);
    reset({
      description: "",
      payee: "",
      txDate: new Date().toISOString().split("T")[0],
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

      await onSave({
        description: resolvedDescription,
        payee: data.payee?.trim() || undefined,
        amount,
        categoryId: selectedCategory,
        transactionType: txType,
        transactionDate: data.txDate,
        notes: data.notes?.trim() || undefined,
      });

      if (isRecurring && onSaveRecurring && recurrenceRule) {
        await onSaveRecurring({
          description: resolvedDescription,
          payee: data.payee?.trim() || undefined,
          amount,
          categoryId: selectedCategory,
          transactionType: txType,
          recurrenceRule,
          startDate: data.txDate,
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

  const isExpense = txType === "expense";

  return (
    <Modal visible={visible} onClose={handleClose} title="Add Transaction" fullScreen>
      <ScrollView className="px-5 pt-3 pb-2" keyboardShouldPersistTaps="handled">
        {/* Hero amount with integrated type toggle */}
        <View className="items-center mb-3">
          {/* Type toggle — compact pill */}
          <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-3">
            <Pressable
              onPress={() => setTxType("expense")}
              className={`px-4 py-1.5 rounded-md ${isExpense ? "bg-white dark:bg-gray-700" : ""}`}
              style={isExpense ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 } : undefined}
            >
              <Text className={`text-sm font-semibold ${isExpense ? "text-danger-500" : "text-gray-400 dark:text-gray-500"}`}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTxType("income")}
              className={`px-4 py-1.5 rounded-md ${!isExpense ? "bg-white dark:bg-gray-700" : ""}`}
              style={!isExpense ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 } : undefined}
            >
              <Text className={`text-sm font-semibold ${!isExpense ? "text-success-500" : "text-gray-400 dark:text-gray-500"}`}>
                Income
              </Text>
            </Pressable>
          </View>

          {/* Large centered amount */}
          <View className="flex-row items-baseline justify-center">
            <Text
              className={`text-3xl font-light ${
                isExpense ? "text-gray-400 dark:text-gray-500" : "text-success-500"
              }`}
            >
              {isExpense ? "-" : "+"}$
            </Text>
            <TextInput
              className="text-4xl font-bold text-gray-900 dark:text-gray-100 min-w-[80px] text-center"
              value={displayAmount}
              onChangeText={handleAmountChange}
              onBlur={handleAmountBlur}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={placeholderColor(isDark)}
              style={{ paddingVertical: 4 }}
            />
          </View>
        </View>

        {/* Divider */}
        <View className="border-b border-gray-100 dark:border-gray-800 mb-3" />

        {/* Form fields — compact spacing */}
        <FormField
          control={control}
          name="description"
          label="Description (optional)"
          placeholder="Description (optional)"
          compact
        />

        <FormField
          control={control}
          name="payee"
          label="Payee (optional)"
          placeholder="Who did you pay?"
          compact
        />

        {/* Date + Category side by side labels */}
        <View className="flex-row gap-3 mb-2.5">
          <View className="flex-1">
            <Controller
              control={control}
              name="txDate"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <DatePicker label="Date" value={value} onChange={onChange} error={error?.message} compact />
              )}
            />
          </View>
        </View>

        {/* Category picker */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</Text>
        <Pressable
          onPress={() => setShowCategoryPicker(true)}
          className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-500 mb-3"
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
          compact
        />

        {/* Recurring toggle */}
        {onSaveRecurring && (
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Make recurring
              </Text>
              <Switch value={isRecurring} onValueChange={setIsRecurring} />
            </View>

            {isRecurring && (
              <RecurrencePresetPicker
                dateStr={watchedTxDate}
                selectedRule={recurrenceRule}
                onSelectRule={setRecurrenceRule}
                onCustomPress={() => setShowCustomRecurrence(true)}
              />
            )}
          </View>
        )}

        {onSaveRecurring && isRecurring && (
          <CustomRecurrenceModal
            visible={showCustomRecurrence}
            onClose={() => setShowCustomRecurrence(false)}
            onSave={(rule) => setRecurrenceRule(rule)}
            initialRule={recurrenceRule}
            referenceDate={watchedTxDate}
          />
        )}

        <Button title="Save Transaction" onPress={onSubmit} isLoading={isLoading} />
        <View className="h-4" />
      </ScrollView>
    </Modal>
  );
}
