import { useState } from "react";
import { View, Text, ScrollView, Share } from "react-native";
import { useRouter } from "expo-router";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useHouseholdBudget } from "@/features/household/hooks/useHouseholdBudget";
import { SetupHousehold } from "@/components/household/SetupHousehold";
import { HouseholdSummary } from "@/components/household/HouseholdSummary";
import { MonthPicker } from "@/components/budget/MonthPicker";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getPreviousMonth, getNextMonth } from "@/utils/date";

export default function HouseholdScreen() {
  const router = useRouter();
  const { household, householdId, userRole, isLoading } = useHousehold();

  const [monthState, setMonthState] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const { summary, memberBudgets, categoryBreakdown } = useHouseholdBudget(
    householdId,
    monthState.month,
    monthState.year
  );

  if (isLoading) return null;
  if (!household) return <SetupHousehold />;

  const handleShareCode = async () => {
    if (!household.invite_code) return;
    try {
      await Share.share({
        message: `Join my household on iBudget! Use invite code: ${household.invite_code}`,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Card className="mx-4 mt-4 mb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">
              {household.name}
            </Text>
            <Text className="text-sm text-gray-500 capitalize">
              {userRole ?? "member"}
            </Text>
          </View>
          <Button
            title="Members"
            variant="ghost"
            onPress={() => router.push("/(tabs)/household/members")}
          />
        </View>
      </Card>

      <Card className="mx-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-500">Invite Code</Text>
            <Text className="text-lg font-mono font-bold text-primary-600">
              {household.invite_code ?? "—"}
            </Text>
          </View>
          <Button title="Share" variant="secondary" onPress={handleShareCode} />
        </View>
      </Card>

      <MonthPicker
        month={monthState.month}
        year={monthState.year}
        onPrevious={() =>
          setMonthState((p) => getPreviousMonth(p.month, p.year))
        }
        onNext={() => setMonthState((p) => getNextMonth(p.month, p.year))}
      />

      <HouseholdSummary
        totalIncome={summary.total_income}
        totalAllocated={summary.total_allocated}
        totalSpent={summary.total_spent}
        memberCount={summary.member_count}
        memberBudgets={memberBudgets}
        categoryBreakdown={categoryBreakdown}
      />

      <View className="h-8" />
    </ScrollView>
  );
}
