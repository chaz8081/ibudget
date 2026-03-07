import { Stack } from "expo-router";

export default function TransactionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Transactions" }} />
      <Stack.Screen name="[id]" options={{ title: "Transaction Details" }} />
      <Stack.Screen name="recurring" options={{ title: "Recurring" }} />
    </Stack>
  );
}
