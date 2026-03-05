import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";

export default function HouseholdLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isDark ? "#111827" : "#ffffff" },
        headerTintColor: isDark ? "#f3f4f6" : "#111827",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Household" }} />
      <Stack.Screen name="members" options={{ title: "Members" }} />
      <Stack.Screen name="manage" options={{ title: "Manage Household" }} />
    </Stack>
  );
}
