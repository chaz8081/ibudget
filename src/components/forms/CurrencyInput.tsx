import { useState, useCallback } from "react";
import { Text, TextInput, View } from "react-native";
import { useColorScheme } from "nativewind";
import { formatCents, parseCurrencyInput } from "@/utils/currency";
import { placeholderColor } from "@/constants/colors";

type CurrencyInputProps = {
  label?: string;
  value: number; // cents
  onChangeValue: (cents: number) => void;
  error?: string;
  compact?: boolean;
};

export function CurrencyInput({
  label,
  value,
  onChangeValue,
  error,
  compact,
}: CurrencyInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

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
    <View className={compact ? "mb-2.5" : "mb-4"}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</Text>
      )}
      <View className={`flex-row items-center border rounded-xl px-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500 ${compact ? "py-2.5" : "py-3"}`}>
        <Text className="text-base text-gray-500 dark:text-gray-400 mr-1">$</Text>
        <TextInput
          className="flex-1 text-base text-gray-900 dark:text-gray-100"
          value={displayText}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={placeholderColor(isDark)}
        />
      </View>
      {error && <Text className="text-sm text-danger-500 mt-1">{error}</Text>}
    </View>
  );
}
