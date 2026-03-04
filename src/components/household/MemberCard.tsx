import { View, Text } from "react-native";
import { Card } from "@/components/ui/Card";

type MemberCardProps = {
  displayName: string;
  role: string;
  isCurrentUser?: boolean;
};

const roleColors: Record<string, string> = {
  owner: "bg-primary-100 text-primary-700",
  admin: "bg-warning-500/10 text-warning-600",
  member: "bg-gray-100 text-gray-600",
};

export function MemberCard({ displayName, role, isCurrentUser }: MemberCardProps) {
  return (
    <Card className="mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Text className="text-primary-700 font-bold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-base font-medium text-gray-900">
              {displayName}
              {isCurrentUser ? " (you)" : ""}
            </Text>
          </View>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${roleColors[role] ?? roleColors.member}`}>
          <Text className="text-xs font-medium capitalize">{role}</Text>
        </View>
      </View>
    </Card>
  );
}
