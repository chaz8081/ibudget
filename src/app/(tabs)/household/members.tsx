import { View, Text, FlatList } from "react-native";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useHouseholdMembers } from "@/features/household/hooks/useHouseholdMembers";
import { MemberCard } from "@/components/household/MemberCard";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/ui/PageContainer";

export default function MembersScreen() {
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { members, isLoading } = useHouseholdMembers(householdId);

  if (isLoading) return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <SkeletonList count={3} />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <PageContainer>
      <Text className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {members.length} {members.length === 1 ? "Member" : "Members"}
      </Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item }) => (
          <MemberCard
            displayName={item.display_name || "Unknown"}
            role={item.role}
            isCurrentUser={item.user_id === user?.id}
          />
        )}
      />
      </PageContainer>
    </View>
  );
}
