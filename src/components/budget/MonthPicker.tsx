import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { formatMonthYear } from "@/utils/date";

type MonthPickerProps = {
  month: number;
  year: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function MonthPicker({
  month,
  year,
  onPrevious,
  onNext,
}: MonthPickerProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#d1d5db" : "#374151";

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Pressable onPress={onPrevious} className="p-2">
        <Ionicons name="chevron-back" size={24} color={iconColor} />
      </Pressable>
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {formatMonthYear(month, year)}
      </Text>
      <Pressable onPress={onNext} className="p-2">
        <Ionicons name="chevron-forward" size={24} color={iconColor} />
      </Pressable>
    </View>
  );
}
