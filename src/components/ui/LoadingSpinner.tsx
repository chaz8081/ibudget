import { View, ActivityIndicator, Text } from "react-native";

type LoadingSpinnerProps = {
  message?: string;
};

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#2563eb" />
      {message && (
        <Text className="text-sm text-gray-500 mt-3">{message}</Text>
      )}
    </View>
  );
}
