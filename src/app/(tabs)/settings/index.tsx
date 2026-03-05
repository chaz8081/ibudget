import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { useColorScheme } from "nativewind";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import * as SecureStore from "expo-secure-store";

type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "ibudget_theme";

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSetTheme = (pref: ThemePreference) => {
    SecureStore.setItemAsync(THEME_KEY, pref);
    if (pref === "system") {
      setColorScheme("system");
    } else {
      setColorScheme(pref);
    }
  };

  // Read current preference from SecureStore for highlight
  // We use colorScheme as a proxy since the preference is applied to NativeWind
  const currentPref: ThemePreference =
    colorScheme === "light" ? "light" : colorScheme === "dark" ? "dark" : "system";

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
              <Ionicons name="person-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text className="flex-1 text-base text-gray-900 dark:text-gray-100 ml-3">Edit Profile</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? "#6b7280" : "#9ca3af"} />
            </View>
          </Card>
        </Pressable>
      </Link>

      {/* Theme selector */}
      <Card className="mb-2">
        <View className="flex-row items-center mb-3">
          <Ionicons name="color-palette-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
          <Text className="flex-1 text-base text-gray-900 dark:text-gray-100 ml-3">Appearance</Text>
        </View>
        <View className="flex-row bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {THEME_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleSetTheme(option.value)}
              className={`flex-1 py-2 rounded-lg items-center ${
                currentPref === option.value ? "bg-white dark:bg-gray-600 shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  currentPref === option.value
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

      <View className="mt-6">
        <Button title="Sign Out" variant="danger" onPress={signOut} />
      </View>

      <Text className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
        iBudget v1.0.0 — Local Mode
      </Text>
    </View>
  );
}
