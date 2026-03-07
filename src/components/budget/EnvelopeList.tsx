import { View, Text, FlatList } from "react-native";
import { EnvelopeCard } from "./EnvelopeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EnvelopeWithBalance } from "@/features/budget/utils/budget-calculations";
import { CATEGORY_GROUPS } from "@/features/budget/schemas/envelope.schema";

type EnvelopeListProps = {
  envelopes: EnvelopeWithBalance[];
  onEnvelopePress?: (envelope: EnvelopeWithBalance) => void;
  onAddCategory?: () => void;
};

export function EnvelopeList({ envelopes, onEnvelopePress, onAddCategory }: EnvelopeListProps) {
  // Group by category_group
  const grouped = CATEGORY_GROUPS.map((group) => ({
    group: group.label,
    data: envelopes.filter((e) => e.category_group === group.value),
  })).filter((g) => g.data.length > 0);

  if (envelopes.length === 0) {
    return (
      <EmptyState
        icon="📁"
        title="No Envelopes"
        message="Add a category to start budgeting"
        actionTitle={onAddCategory ? "Add Category" : undefined}
        onAction={onAddCategory}
      />
    );
  }

  return (
    <FlatList
      data={grouped}
      keyExtractor={(item) => item.group}
      contentContainerClassName="px-4 pb-4"
      renderItem={({ item }) => (
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {item.group}
          </Text>
          {item.data.map((envelope) => (
            <EnvelopeCard
              key={envelope.id}
              envelope={envelope}
              onPress={() => onEnvelopePress?.(envelope)}
            />
          ))}
        </View>
      )}
    />
  );
}
