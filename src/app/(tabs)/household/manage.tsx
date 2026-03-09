import { View, Text, Share, Alert } from "react-native";
import { showAlert } from "@/utils/confirm";
import { useRouter } from "expo-router";
import { usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useHouseholdMembers } from "@/features/household/hooks/useHouseholdMembers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MemberCard } from "@/components/household/MemberCard";
import { HOUSEHOLD_MEMBERS_TABLE, PROFILES_TABLE } from "@/db/tables";
import { getErrorMessage } from "@/utils/errors";
import { PageContainer } from "@/components/ui/PageContainer";
import { useToast } from "@/contexts/ToastContext";

export default function ManageHouseholdScreen() {
  const { showToast } = useToast();
  const router = useRouter();
  const db = usePowerSync();
  const { user } = useAuth();
  const { household, householdId, userRole } = useHousehold();
  const { members } = useHouseholdMembers(householdId);

  if (!household) return null;

  const handleShareCode = async () => {
    if (!household.invite_code) return;
    try {
      await Share.share({
        message: `Join my household on iBudget! Use invite code: ${household.invite_code}`,
      });
      showToast("Invite shared");
    } catch {
      // User cancelled
    }
  };

  const handleLeave = () => {
    showAlert(
      "Leave Household",
      "Are you sure you want to leave this household? You will lose access to all shared data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await db.execute(
                `DELETE FROM ${HOUSEHOLD_MEMBERS_TABLE} WHERE household_id = ? AND user_id = ?`,
                [householdId, user?.id]
              );
              await db.execute(
                `UPDATE ${PROFILES_TABLE} SET household_id = NULL, updated_at = ? WHERE id = ?`,
                [new Date().toISOString(), user?.id]
              );
              router.replace("/(tabs)/household");
              showToast("Left household");
            } catch (error) {
              Alert.alert("Error", getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <PageContainer className="px-4 pt-4">
      {/* Household name */}
      <Card className="mb-4">
        <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Household Name
        </Text>
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {household.name}
        </Text>
      </Card>

      {/* Invite code */}
      <Card className="mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Invite Code
            </Text>
            <Text className="text-lg font-mono font-bold text-primary-600">
              {household.invite_code ?? "\u2014"}
            </Text>
          </View>
          <Button title="Share" variant="secondary" onPress={handleShareCode} />
        </View>
      </Card>

      {/* Members */}
      <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        {members.length} {members.length === 1 ? "Member" : "Members"}
      </Text>
      {members.map((member) => (
        <MemberCard
          key={member.id}
          displayName={member.display_name || "Unknown"}
          role={member.role}
          isCurrentUser={member.user_id === user?.id}
        />
      ))}

      {/* Leave household */}
      {userRole !== "owner" && (
        <View className="mt-6">
          <Button title="Leave Household" variant="danger" onPress={handleLeave} />
        </View>
      )}
      </PageContainer>
    </View>
  );
}
