import { useState, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { Colors } from "@/constants/colors";

type DatePickerProps = {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  error?: string;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function DatePicker({ label, value, onChange, minDate, maxDate, error }: DatePickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [visible, setVisible] = useState(false);

  const selectedDate = value ? parseISO(value) : new Date();
  const [viewMonth, setViewMonth] = useState(selectedDate);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  const handleDayPress = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"));
    setVisible(false);
  };

  const isDayDisabled = (day: Date) => {
    if (minDate && isBefore(day, parseISO(minDate))) return true;
    if (maxDate && isAfter(day, parseISO(maxDate))) return true;
    return false;
  };

  const handleOpen = () => {
    setViewMonth(selectedDate);
    setVisible(true);
  };

  const displayText = value ? format(parseISO(value), "MMM d, yyyy") : "Select date";

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </Text>
      )}
      <Pressable
        onPress={handleOpen}
        className={`border rounded-xl px-4 py-3 bg-white dark:bg-gray-800 ${
          error ? "border-danger-500" : "border-gray-300 dark:border-gray-500"
        }`}
      >
        <Text
          className={`text-base ${
            value
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {displayText}
        </Text>
      </Pressable>
      {error && (
        <Text className="text-sm text-danger-500 mt-1">{error}</Text>
      )}

      <Modal visible={visible} onClose={() => setVisible(false)} title="Select Date">
        <View className="px-6 py-4">
          {/* Month/Year navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => setViewMonth(subMonths(viewMonth, 1))} className="p-2">
              <Ionicons
                name="chevron-back"
                size={24}
                color={isDark ? Colors.gray[300] : Colors.gray[700]}
              />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {format(viewMonth, "MMMM yyyy")}
            </Text>
            <Pressable onPress={() => setViewMonth(addMonths(viewMonth, 1))} className="p-2">
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? Colors.gray[300] : Colors.gray[700]}
              />
            </Pressable>
          </View>

          {/* Day-of-week header */}
          <View className="flex-row mb-2">
            {DAY_LABELS.map((d, i) => (
              <View key={i} className="flex-1 items-center">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View className="flex-row flex-wrap">
            {days.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, viewMonth);
              const disabled = isDayDisabled(day);

              return (
                <Pressable
                  key={i}
                  onPress={() => !disabled && handleDayPress(day)}
                  disabled={disabled}
                  style={{ width: "14.28%" }}
                  className="items-center py-1.5"
                >
                  <View
                    className={`w-9 h-9 items-center justify-center rounded-full ${
                      isSelected ? "bg-primary-600" : ""
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? "text-white font-bold"
                          : disabled
                            ? "text-gray-300 dark:text-gray-600"
                            : isCurrentMonth
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-400 dark:text-gray-600"
                      }`}
                    >
                      {format(day, "d")}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}
