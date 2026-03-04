import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Pressable onPress={onPrevious} className="p-2">
        <Ionicons name="chevron-back" size={24} color="#374151" />
      </Pressable>
      <Text className="text-lg font-semibold text-gray-900">
        {formatMonthYear(month, year)}
      </Text>
      <Pressable onPress={onNext} className="p-2">
        <Ionicons name="chevron-forward" size={24} color="#374151" />
      </Pressable>
    </View>
  );
}
