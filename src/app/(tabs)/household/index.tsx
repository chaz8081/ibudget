import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useHouseholdBudget } from "@/features/household/hooks/useHouseholdBudget";
import { SetupHousehold } from "@/components/household/SetupHousehold";
import { CategoryBreakdown } from "@/components/household/CategoryBreakdown";
import { HouseholdActivity } from "@/components/household/HouseholdActivity";
import { MonthPicker } from "@/components/budget/MonthPicker";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/utils/currency";
import { getPreviousMonth, getNextMonth } from "@/utils/date";
import { useNavigation } from "expo-router";
import { useLayoutEffect } from "react";

export default function HouseholdScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { household, householdId, userRole, isLoading } = useHousehold();
  const [activeTab, setActiveTab] = useState<"budget" | "activity">("budget");

  const [monthState, setMonthState] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const { summary, categoryBreakdown } = useHouseholdBudget(
    householdId,
    monthState.month,
    monthState.year
  );

  // Add gear icon to header for manage screen
  useLayoutEffect(() => {
    if (household) {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(tabs)/household/manage")}
            className="p-2 mr-2"
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={isDark ? "#d1d5db" : "#374151"}
            />
          </Pressable>
        ),
      });
    }
  }, [navigation, household, isDark, router]);

  if (isLoading) return null;
  if (!household) return <SetupHousehold />;

  const remaining = summary.total_income - summary.total_spent;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <MonthPicker
        month={monthState.month}
        year={monthState.year}
        onPrevious={() =>
          setMonthState((p) => getPreviousMonth(p.month, p.year))
        }
        onNext={() => setMonthState((p) => getNextMonth(p.month, p.year))}
      />

      {/* Compact 2x2 summary */}
      <Card className="mx-4 mb-4">
        <View className="flex-row mb-3">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase">Income</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCents(summary.total_income)}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase">Spent</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCents(summary.total_spent)}
            </Text>
          </View>
        </View>
        <View className="flex-row pt-3 border-t border-gray-100 dark:border-gray-700">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase">Budgeted</Text>
            <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">
              {formatCents(summary.total_allocated)}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase">Remaining</Text>
            <Text
              className={`text-base font-semibold ${
                remaining < 0 ? "text-danger-500" : "text-success-500"
              }`}
            >
              {formatCents(remaining)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Segmented control */}
      <View className="mx-4 mb-4 flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <Pressable
          onPress={() => setActiveTab("budget")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "budget" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              activeTab === "budget"
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Budget
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("activity")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "activity" ? "bg-white dark:bg-gray-700 shadow-sm" : ""
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              activeTab === "activity"
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Activity
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === "budget" ? (
        <CategoryBreakdown categories={categoryBreakdown} />
      ) : (
        <HouseholdActivity
          householdId={householdId}
          month={monthState.month}
          year={monthState.year}
        />
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
