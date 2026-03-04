import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/forms/CurrencyInput";
import { parseCurrencyInput } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

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
};

export function AddTransactionSheet({
  visible,
  onClose,
  categories,
  onSave,
}: AddTransactionSheetProps) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [payee, setPayee] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txDate, setTxDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setAmount(0);
    setDescription("");
    setPayee("");
    setSelectedCategory("");
    setTxType("expense");
    setTxDate(new Date().toISOString().split("T")[0]);
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
      await onSave({
        description: description.trim(),
        payee: payee.trim() || undefined,
        amount,
        categoryId: selectedCategory,
        transactionType: txType,
        transactionDate: txDate,
      });
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
    onSave,
    onClose,
    resetForm,
  ]);

  return (
    <Modal visible={visible} onClose={onClose} title="Add Transaction">
      <ScrollView className="px-6 py-4" keyboardShouldPersistTaps="handled">
        {/* Type toggle */}
        <View className="flex-row mb-4 bg-gray-100 rounded-xl p-1">
          <Pressable
            onPress={() => setTxType("expense")}
            className={`flex-1 py-2 rounded-lg items-center ${
              txType === "expense" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`font-semibold ${
                txType === "expense" ? "text-danger-500" : "text-gray-500"
              }`}
            >
              Expense
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTxType("income")}
            className={`flex-1 py-2 rounded-lg items-center ${
              txType === "income" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`font-semibold ${
                txType === "income" ? "text-success-500" : "text-gray-500"
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

        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={txDate}
          onChangeText={setTxDate}
          keyboardType="numbers-and-punctuation"
        />

        {/* Category picker */}
        <Text className="text-sm font-medium text-gray-700 mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3 py-1.5 border ${
                selectedCategory === cat.id
                  ? "bg-primary-600 border-primary-600"
                  : "bg-white border-gray-300"
              }`}
            >
              <Text
                className={`text-sm ${
                  selectedCategory === cat.id ? "text-white" : "text-gray-700"
                }`}
              >
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button title="Save Transaction" onPress={handleSave} isLoading={isLoading} />
        <View className="h-8" />
      </ScrollView>
    </Modal>
  );
}
