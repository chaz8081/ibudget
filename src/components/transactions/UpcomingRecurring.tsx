import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/utils/currency";
import { RECURRING_TRANSACTIONS_TABLE } from "@/db/tables";

type UpcomingItem = {
  id: string;
  description: string;
  payee: string | null;
  amount: number;
  next_occurrence_date: string;
  transaction_type: string;
  category_icon: string | null;
  category_name: string | null;
  frequency: string;
};

export function UpcomingRecurring() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: upcoming } = useQuery<UpcomingItem>(
    user?.id
      ? `SELECT rt.id, rt.description, rt.payee, rt.amount,
                rt.next_occurrence_date, rt.transaction_type, rt.frequency,
                c.icon as category_icon, c.name as category_name
         FROM ${RECURRING_TRANSACTIONS_TABLE} rt
         LEFT JOIN categories c ON c.id = rt.category_id
         WHERE rt.user_id = ? AND rt.is_enabled = 1
         ORDER BY rt.next_occurrence_date ASC
         LIMIT 5`
      : "SELECT 1 WHERE 0",
    user?.id ? [user.id] : []
  );

  if (!upcoming || upcoming.length === 0) return null;

  return (
    <View className="mx-4 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Upcoming
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/transactions/recurring")}>
          <Text className="text-sm text-primary-600 font-medium">View All</Text>
        </Pressable>
      </View>
      <Card className="p-0 overflow-hidden">
        {upcoming.map((item, index) => {
          const isIncome = item.transaction_type === "income";
          return (
            <View key={item.id}>
              {index > 0 && (
                <View className="border-b border-gray-100 dark:border-gray-700 ml-12" />
              )}
              <View className="flex-row items-center py-2.5 px-4">
                {item.category_icon ? (
                  <Text className="text-base mr-3">{item.category_icon}</Text>
                ) : (
                  <Text className="text-base mr-3 text-gray-400">{"🔄"}</Text>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
                    {item.payee || item.description}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {item.next_occurrence_date}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-semibold ${
                    isIncome ? "text-success-500" : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {isIncome ? "+" : "-"}{formatCents(item.amount)}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}
