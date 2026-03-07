import "../../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "@react-navigation/native";
// Using Supabase Auth (swap to LocalAuthProvider for offline-only dev)
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DatabaseProvider } from "@/db/provider";
import { View, ActivityIndicator, Appearance, useColorScheme } from "react-native";
import * as Storage from "@/utils/storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (session && !inAuthGroup) {
      router.replace("/(tabs)/dashboard");
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

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    card: "#111827",
    text: "#f3f4f6",
    border: "#374151",
    background: "#030712",
  },
};

const CustomLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    card: "#ffffff",
    text: "#111827",
    border: "#e5e7eb",
    background: "#f9fafb",
  },
};

/**
 * Drives navigation theme from React Native's Appearance API (not NativeWind).
 * NativeWind's setColorScheme triggers an observable cascade that disrupts
 * Expo Router's NavigationContainer context. Using RN's useColorScheme avoids
 * this — both RN and NativeWind listen to the same Appearance change events.
 */
function NavigationThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  // Restore saved theme preference on mount
  useEffect(() => {
    Storage.getItem("ibudget_theme").then((saved) => {
      if (saved === "light" || saved === "dark") {
        Appearance.setColorScheme(saved);
      } else {
        Appearance.setColorScheme("unspecified");
      }
    });
  }, []);

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme}
    >
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider>
        <AuthProvider>
          <DatabaseProvider>
            <AuthGate />
          </DatabaseProvider>
        </AuthProvider>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
