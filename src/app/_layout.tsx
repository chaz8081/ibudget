import "../../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
// Using Supabase Auth (swap to LocalAuthProvider for offline-only dev)
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DatabaseProvider } from "@/db/provider";
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";

function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (session && !inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!session && inAuthGroup) {
      router.replace("/sign-in");
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <DatabaseProvider>
          <AuthGate />
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
