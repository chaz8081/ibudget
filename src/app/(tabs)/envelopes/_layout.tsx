import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";

export default function EnvelopesLayout() {
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
      <Stack.Screen name="index" options={{ title: "Envelopes" }} />
      <Stack.Screen name="[id]" options={{ title: "Envelope Details" }} />
    </Stack>
  );
}
