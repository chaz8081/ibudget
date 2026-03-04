import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function SettingsRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-2">
        <View className="flex-row items-center">
          <Ionicons name={icon} size={20} color="#6b7280" />
          <Text className="flex-1 text-base text-gray-900 ml-3">{label}</Text>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </View>
      </Card>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-4">
      {/* User info */}
      <Card className="mb-6">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Text className="text-primary-700 font-bold text-xl">
              {(profile?.display_name ?? user?.email ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-base font-semibold text-gray-900">
              {profile?.display_name || "User"}
            </Text>
            <Text className="text-sm text-gray-500">{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Settings rows */}
      <SettingsRow
        icon="person-outline"
        label="Edit Profile"
        onPress={() => router.push("/(tabs)/settings/profile")}
      />

      <View className="mt-6">
        <Button title="Sign Out" variant="danger" onPress={signOut} />
      </View>

      <Text className="text-xs text-gray-400 text-center mt-8">
        iBudget v1.0.0 — Local Mode
      </Text>
    </View>
  );
}
