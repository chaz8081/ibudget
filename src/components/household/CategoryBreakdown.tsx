import { View, Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCents } from "@/utils/currency";

type CategoryBreakdownItem = {
  category_id: string;
  category_name: string;
  category_icon: string | null;
  total_allocated: number;
  total_spent: number;
};

type CategoryBreakdownProps = {
  categories: CategoryBreakdownItem[];
};

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-gray-400 dark:text-gray-500">No budget data yet</Text>
      </View>
    );
  }

  return (
    <Card className="mx-4 p-0 overflow-hidden">
      {categories.map((cat, index) => (
        <View key={cat.category_id}>
          {index > 0 && (
            <View className="border-b border-gray-100 dark:border-gray-700 ml-4" />
          )}
          <View className="px-4 py-3">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-base font-medium text-gray-900 dark:text-gray-100">
                {cat.category_icon ? `${cat.category_icon} ` : ""}{cat.category_name}
              </Text>
              <Text className="text-sm text-gray-700 dark:text-gray-300">
                {formatCents(cat.total_spent)} / {formatCents(cat.total_allocated)}
              </Text>
            </View>
            <ProgressBar
              allocated={cat.total_allocated}
              spent={cat.total_spent}
            />
          </View>
        </View>
      ))}
    </Card>
  );
}
