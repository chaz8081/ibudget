import { Stack } from "expo-router";

export default function EnvelopesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Envelopes" }} />
      <Stack.Screen name="[id]" options={{ title: "Envelope Details" }} />
    </Stack>
  );
}
