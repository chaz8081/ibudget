import { Redirect } from "expo-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/colors";

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/sign-in" />;
}
