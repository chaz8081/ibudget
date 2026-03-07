import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { getDay, getDate } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { type RecurrenceRule, describeRecurrence } from "@/features/transactions/utils/recurrence-rule";

type CustomRecurrenceModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: RecurrenceRule) => void;
  initialRule?: RecurrenceRule | null;
  referenceDate: string;
};

const FREQ_OPTIONS: { label: string; value: RecurrenceRule["frequency"] }[] = [
  { label: "Day", value: "daily" },
  { label: "Week", value: "weekly" },
  { label: "Month", value: "monthly" },
  { label: "Year", value: "yearly" },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const ORDINAL_LABELS = ["first", "second", "third", "fourth", "last"];
const ORDINAL_VALUES = [1, 2, 3, 4, -1];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function CustomRecurrenceModal({
  visible,
  onClose,
  onSave,
  initialRule,
  referenceDate,
}: CustomRecurrenceModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const refDate = new Date(referenceDate + "T00:00:00");

  const [frequency, setFrequency] = useState<RecurrenceRule["frequency"]>("monthly");
  const [interval, setInterval] = useState(1);
  const [byDayOfWeek, setByDayOfWeek] = useState<number[]>([]);
  const [monthlyMode, setMonthlyMode] = useState<"day" | "ordinal">("day");
  const [byMonthDay, setByMonthDay] = useState<number[]>([]);
  const [bySetPos, setBySetPos] = useState(1);
  const [ordinalDay, setOrdinalDay] = useState(0);
  const [endType, setEndType] = useState<RecurrenceRule["endType"]>("never");
  const [endDate, setEndDate] = useState("");
  const [endCount, setEndCount] = useState("12");

  useEffect(() => {
    if (initialRule) {
      setFrequency(initialRule.frequency);
      setInterval(initialRule.interval);
      setByDayOfWeek(initialRule.byDayOfWeek ?? []);
      setEndType(initialRule.endType);
      setEndDate(initialRule.endDate ?? "");
      setEndCount(initialRule.endCount?.toString() ?? "12");

      if (initialRule.byMonthDay) {
        setMonthlyMode("day");
        setByMonthDay(initialRule.byMonthDay);
      } else if (initialRule.bySetPos != null && initialRule.byDayOfWeek) {
        setMonthlyMode("ordinal");
        setBySetPos(initialRule.bySetPos);
        setOrdinalDay(initialRule.byDayOfWeek[0] ?? 0);
      }
    } else {
      setByDayOfWeek([getDay(refDate)]);
      setByMonthDay([getDate(refDate)]);
      setOrdinalDay(getDay(refDate));
    }
  }, [initialRule, referenceDate]);

  const buildRule = (): RecurrenceRule => {
    const rule: RecurrenceRule = {
      frequency,
      interval,
      endType,
      endDate: endType === "on_date" ? endDate : undefined,
      endCount: endType === "after_count" ? parseInt(endCount) || 1 : undefined,
    };

    if (frequency === "weekly" && byDayOfWeek.length > 0) {
      rule.byDayOfWeek = [...byDayOfWeek].sort((a, b) => a - b);
    }

    if (frequency === "monthly") {
      if (monthlyMode === "ordinal") {
        rule.bySetPos = bySetPos;
        rule.byDayOfWeek = [ordinalDay];
      } else {
        rule.byMonthDay = byMonthDay;
      }
    }

    return rule;
  };

  const currentRule = buildRule();
  const summary = describeRecurrence(currentRule);

  const toggleDay = (day: number) => {
    setByDayOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDone = () => {
    onSave(buildRule());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Custom Recurrence"
      actionLabel="Done"
      onAction={handleDone}
      fullScreen
    >
      <ScrollView className="px-5 pt-4" keyboardShouldPersistTaps="handled">
        {/* Repeat every N [frequency] */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Repeat every
        </Text>
        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
            <Pressable
              onPress={() => setInterval((v) => Math.max(1, v - 1))}
              className="px-3 py-2"
            >
              <Ionicons name="remove" size={18} color={isDark ? "#d1d5db" : "#374151"} />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 min-w-[28px] text-center">
              {interval}
            </Text>
            <Pressable
              onPress={() => setInterval((v) => v + 1)}
              className="px-3 py-2"
            >
              <Ionicons name="add" size={18} color={isDark ? "#d1d5db" : "#374151"} />
            </Pressable>
          </View>

          <View className="flex-row flex-1 gap-1">
            {FREQ_OPTIONS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFrequency(f.value)}
                className={`flex-1 py-2 rounded-lg items-center ${
                  frequency === f.value ? "bg-primary-600" : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    frequency === f.value ? "text-white" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Day-of-week selection (weekly) */}
        {frequency === "weekly" && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On</Text>
            <View className="flex-row justify-between">
              {DAY_LABELS.map((label, i) => {
                const selected = byDayOfWeek.includes(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      selected ? "bg-primary-600" : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      selected ? "text-white" : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Monthly anchor */}
        {frequency === "monthly" && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On</Text>
            <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-3">
              <Pressable
                onPress={() => setMonthlyMode("day")}
                className={`flex-1 py-2 rounded-md items-center ${
                  monthlyMode === "day" ? "bg-white dark:bg-gray-700" : ""
                }`}
              >
                <Text className={`text-sm font-medium ${
                  monthlyMode === "day" ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                }`}>
                  Day {byMonthDay[0] ?? getDate(refDate)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMonthlyMode("ordinal")}
                className={`flex-1 py-2 rounded-md items-center ${
                  monthlyMode === "ordinal" ? "bg-white dark:bg-gray-700" : ""
                }`}
              >
                <Text className={`text-sm font-medium ${
                  monthlyMode === "ordinal" ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {ORDINAL_LABELS[ORDINAL_VALUES.indexOf(bySetPos)] ?? "first"} {DAY_NAMES_FULL[ordinalDay]}
                </Text>
              </Pressable>
            </View>

            {monthlyMode === "ordinal" && (
              <View>
                <View className="flex-row flex-wrap gap-1.5 mb-2">
                  {ORDINAL_LABELS.map((label, i) => {
                    const val = ORDINAL_VALUES[i];
                    const selected = bySetPos === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setBySetPos(val)}
                        className={`rounded-full px-3 py-1.5 ${
                          selected ? "bg-primary-600" : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <Text className={`text-xs font-medium capitalize ${
                          selected ? "text-white" : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {DAY_NAMES_FULL.map((name, i) => {
                    const selected = ordinalDay === i;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => setOrdinalDay(i)}
                        className={`rounded-full px-3 py-1.5 ${
                          selected ? "bg-primary-600" : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <Text className={`text-xs font-medium ${
                          selected ? "text-white" : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {name.slice(0, 3)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Ends */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ends</Text>
        <View className="mb-4">
          <Pressable onPress={() => setEndType("never")} className="flex-row items-center py-2.5">
            <Ionicons
              name={endType === "never" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={endType === "never" ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300">Never</Text>
          </Pressable>

          <Pressable onPress={() => setEndType("on_date")} className="flex-row items-center py-2.5">
            <Ionicons
              name={endType === "on_date" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={endType === "on_date" ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300">On date</Text>
          </Pressable>
          {endType === "on_date" && (
            <View className="ml-9 mt-1">
              <DatePicker label="" value={endDate} onChange={setEndDate} minDate={referenceDate} compact />
            </View>
          )}

          <Pressable onPress={() => setEndType("after_count")} className="flex-row items-center py-2.5">
            <Ionicons
              name={endType === "after_count" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={endType === "after_count" ? (isDark ? "#60a5fa" : "#2563eb") : (isDark ? "#6b7280" : "#9ca3af")}
            />
            <Text className="ml-3 text-sm text-gray-700 dark:text-gray-300">After</Text>
            {endType === "after_count" && (
              <View className="flex-row items-center ml-2">
                <TextInput
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 min-w-[48px] text-center"
                  value={endCount}
                  onChangeText={setEndCount}
                  keyboardType="number-pad"
                />
                <Text className="ml-2 text-sm text-gray-700 dark:text-gray-300">occurrences</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Live summary */}
        <View className="bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3 mb-4">
          <Text className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {summary}
          </Text>
        </View>

        <View className="h-8" />
      </ScrollView>
    </Modal>
  );
}
