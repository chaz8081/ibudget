import "../../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
// Swap to AuthProvider (from ./AuthProvider) when Supabase is configured
import { LocalAuthProvider as AuthProvider } from "@/features/auth/providers/LocalAuthProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DatabaseProvider } from "@/db/provider";
import { View, ActivityIndicator } from "react-native";

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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DatabaseProvider>
        <AuthGate />
      </DatabaseProvider>
    </AuthProvider>
  );
}
