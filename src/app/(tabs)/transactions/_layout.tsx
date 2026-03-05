import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";

export default function TransactionsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Transactions" }} />
      <Stack.Screen name="[id]" options={{ title: "Transaction Details" }} />
      <Stack.Screen name="recurring" options={{ title: "Recurring" }} />
    </Stack>
  );
}
