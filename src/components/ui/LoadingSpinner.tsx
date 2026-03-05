import { View, ActivityIndicator, Text } from "react-native";
import { useColorScheme } from "nativewind";

type LoadingSpinnerProps = {
  message?: string;
};

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
      <ActivityIndicator size="large" color={isDark ? "#60a5fa" : "#2563eb"} />
      {message && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-3">{message}</Text>
      )}
    </View>
  );
}
