import { useEffect, useState, useCallback } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "ibudget_theme";

export type ThemePreference = "light" | "dark" | "system";

export function useTheme() {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreference(saved);
        if (saved !== "system") {
          setColorScheme(saved);
        } else {
          setColorScheme("system");
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const setTheme = useCallback(
    async (pref: ThemePreference) => {
      setPreference(pref);
      await SecureStore.setItemAsync(THEME_KEY, pref);
      if (pref === "system") {
        setColorScheme("system");
      } else {
        setColorScheme(pref);
      }
    },
    [setColorScheme]
  );

  return { colorScheme, preference, setTheme, isLoaded };
}
