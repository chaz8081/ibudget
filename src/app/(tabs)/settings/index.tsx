import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { showAlert } from "@/utils/confirm";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { useTheme, type ThemePreference } from "@/hooks/useTheme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { seedDemoData } from "@/utils/seed-demo-data";
import { getErrorMessage } from "@/utils/errors";
import { Colors } from "@/constants/colors";
import { useToast } from "@/contexts/ToastContext";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export default function SettingsScreen() {
  const { showToast } = useToast();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { householdId } = useHousehold();
  const db = usePowerSync();
  const { colorScheme, preference, setTheme } = useTheme();
  const isDark = colorScheme === "dark";
  const [seeding, setSeeding] = useState(false);

  const handleSeedData = () => {
    const message = householdId
      ? "This will add demo data alongside your existing data. Continue?"
      : "This will create a demo household with sample budget, envelopes, and transactions.";
    showAlert("Load Demo Data", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Load",
        onPress: async () => {
          if (!user?.id) return;
          setSeeding(true);
          try {
            await seedDemoData(db, user.id);
            showToast("Demo data loaded! Go to Dashboard to see it.");
          } catch (error) {
            console.error("Seed demo data error:", error);
            Alert.alert("Error", getErrorMessage(error));
          } finally {
            setSeeding(false);
          }
        },
      },
    ]);
  };

  const handleSetTheme = (pref: ThemePreference) => {
    setTheme(pref);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4">
      {/* User info */}
      <Card className="mb-6">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Text className="text-primary-700 font-bold text-xl">
              {(profile?.display_name ?? user?.email ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {profile?.display_name || "User"}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Edit Profile link */}
      <Link href="/(tabs)/settings/profile" asChild>
        <Pressable>
          <Card className="mb-2">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
              <Text className="flex-1 text-base text-gray-900 dark:text-gray-100 ml-3">Edit Profile</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
            </View>
          </Card>
        </Pressable>
      </Link>

      {/* Theme selector */}
      <Card className="mb-2">
        <View className="flex-row items-center mb-3">
          <Ionicons name="color-palette-outline" size={20} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
          <Text className="flex-1 text-base text-gray-900 dark:text-gray-100 ml-3">Appearance</Text>
        </View>
        <View className="flex-row bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {THEME_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleSetTheme(option.value)}
              className={`flex-1 py-2 rounded-lg items-center ${
                preference === option.value ? "bg-white dark:bg-gray-600" : ""
              }`}
              style={preference === option.value ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : undefined}
            >
              <Text
                className={`text-sm font-medium ${
                  preference === option.value
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Load Demo Data — dev only */}
      {process.env.EXPO_PUBLIC_AUTH_PROVIDER === "local" && (
        <Pressable onPress={handleSeedData} disabled={seeding}>
          <Card className="mb-2">
            <View className="flex-row items-center">
              <Ionicons name="flask-outline" size={20} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
              <Text className="flex-1 text-base text-gray-900 dark:text-gray-100 ml-3">
                {seeding ? "Loading..." : "Load Demo Data"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
            </View>
          </Card>
        </Pressable>
      )}

      <View className="mt-6">
        <Button title="Sign Out" variant="danger" onPress={signOut} />
      </View>

      <Text className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
        iBudget v1.0.0{process.env.EXPO_PUBLIC_AUTH_PROVIDER === "local" ? " — Local Mode" : ""}
      </Text>
    </View>
  );
}
