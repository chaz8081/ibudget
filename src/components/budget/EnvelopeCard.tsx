import { View, Text, Pressable, Platform } from "react-native";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCents } from "@/utils/currency";
import type { EnvelopeWithBalance } from "@/features/budget/utils/budget-calculations";

type EnvelopeCardProps = {
  envelope: EnvelopeWithBalance;
  onPress?: () => void;
};

export function EnvelopeCard({ envelope, onPress }: EnvelopeCardProps) {
  const { name, icon, allocated, spent, remaining } = envelope;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        ...(Platform.OS === "web" ? { cursor: "pointer" as never } : {}),
      })}
    >
      <Card className="mb-2">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            {icon && <Text className="text-lg mr-2">{icon}</Text>}
            <Text className="text-base font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
              {name}
            </Text>
          </View>
          <Text
            className={`text-base font-semibold ${
              remaining < 0 ? "text-danger-500" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {formatCents(remaining)}
          </Text>
        </View>

        <ProgressBar allocated={allocated} spent={spent} />

        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {formatCents(spent)} spent
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            of {formatCents(allocated)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
