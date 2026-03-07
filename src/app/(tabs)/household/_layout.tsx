import { Stack } from "expo-router";

export default function HouseholdLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Household" }} />
      <Stack.Screen name="members" options={{ title: "Members" }} />
      <Stack.Screen name="manage" options={{ title: "Manage Household" }} />
    </Stack>
  );
}
