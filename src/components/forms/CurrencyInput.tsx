import { useState, useCallback } from "react";
import { Text, TextInput, View } from "react-native";
import { formatCents, parseCurrencyInput } from "@/utils/currency";

type CurrencyInputProps = {
  label?: string;
  value: number; // cents
  onChangeValue: (cents: number) => void;
  error?: string;
};

export function CurrencyInput({
  label,
  value,
  onChangeValue,
  error,
}: CurrencyInputProps) {
  const [displayText, setDisplayText] = useState(
    value > 0 ? (value / 100).toFixed(2) : ""
  );

  const handleChangeText = useCallback(
    (text: string) => {
      // Allow only numbers and one decimal
      const cleaned = text.replace(/[^0-9.]/g, "");
      // Prevent multiple decimals
      const parts = cleaned.split(".");
      const formatted =
        parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;

      setDisplayText(formatted);
      onChangeValue(parseCurrencyInput(formatted));
    },
    [onChangeValue]
  );

  const handleBlur = useCallback(() => {
    if (displayText) {
      const cents = parseCurrencyInput(displayText);
      setDisplayText((cents / 100).toFixed(2));
    }
  }, [displayText]);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      )}
      <View className="flex-row items-center border rounded-xl px-4 py-3 bg-white border-gray-300">
        <Text className="text-base text-gray-500 mr-1">$</Text>
        <TextInput
          className="flex-1 text-base text-gray-900"
          value={displayText}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#9ca3af"
        />
      </View>
      {error && <Text className="text-sm text-danger-500 mt-1">{error}</Text>}
    </View>
  );
}
