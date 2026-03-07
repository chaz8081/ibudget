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
import { Colors } from "@/constants/colors";
import { ToastProvider } from "@/contexts/ToastContext";

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
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  return <Slot />;
}

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    card: Colors.gray[900],
    text: Colors.gray[100],
    border: Colors.gray[700],
    background: Colors.gray[950],
  },
};

const CustomLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    card: Colors.white,
    text: Colors.gray[900],
    border: Colors.gray[200],
    background: Colors.gray[50],
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

  // Restore saved theme preference on mount.
  // Deferred to avoid triggering Appearance changes during the initial
  // React render/mount cycle, which can disrupt navigation context on Android.
  useEffect(() => {
    Storage.getItem("ibudget_theme").then((saved) => {
      setTimeout(() => {
        if (saved === "light" || saved === "dark") {
          Appearance.setColorScheme(saved);
        }
        // Don't set "unspecified" on mount — let the system default stand
      }, 0);
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
            <ToastProvider>
              <AuthGate />
            </ToastProvider>
          </DatabaseProvider>
        </AuthProvider>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
