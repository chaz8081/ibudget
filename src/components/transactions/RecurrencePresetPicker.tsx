import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { type RecurrenceRule, generatePresets, describeRecurrence } from "@/features/transactions/utils/recurrence-rule";

type RecurrencePresetPickerProps = {
  dateStr: string;
  selectedRule: RecurrenceRule | null;
  onSelectRule: (rule: RecurrenceRule) => void;
  onCustomPress: () => void;
};

export function RecurrencePresetPicker({
  dateStr,
  selectedRule,
  onSelectRule,
  onCustomPress,
}: RecurrencePresetPickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const presets = generatePresets(dateStr);

  const selectedDesc = selectedRule ? describeRecurrence(selectedRule) : null;
  const isCustom = selectedRule && !presets.some((p) => describeRecurrence(p.rule) === selectedDesc);

  return (
    <View className="mb-3">
      {presets.map((preset, i) => {
        const isSelected = selectedDesc === preset.label || selectedDesc === describeRecurrence(preset.rule);
        return (
          <Pressable
            key={i}
            onPress={() => onSelectRule(preset.rule)}
            className={`flex-row items-center py-2.5 px-3 rounded-lg mb-1 ${
              isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
            }`}
          >
            <Ionicons
              name={isSelected ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={isSelected ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className={`ml-3 text-sm ${
              isSelected
                ? "text-primary-700 dark:text-primary-300 font-medium"
                : "text-gray-700 dark:text-gray-300"
            }`}>
              {preset.label}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onCustomPress}
        className={`flex-row items-center py-2.5 px-3 rounded-lg ${
          isCustom ? "bg-primary-50 dark:bg-primary-900/20" : ""
        }`}
      >
        <Ionicons
          name={isCustom ? "radio-button-on" : "radio-button-off"}
          size={20}
          color={isCustom ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
        />
        <Text className={`ml-3 text-sm ${
          isCustom
            ? "text-primary-700 dark:text-primary-300 font-medium"
            : "text-gray-700 dark:text-gray-300"
        }`}>
          {isCustom && selectedRule ? describeRecurrence(selectedRule) : "Custom..."}
        </Text>
      </Pressable>
    </View>
  );
}
