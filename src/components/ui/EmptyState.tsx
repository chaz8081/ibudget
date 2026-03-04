import { View, Text } from "react-native";
import { Button } from "./Button";

type EmptyStateProps = {
  icon?: string;
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  message,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {icon && <Text className="text-5xl mb-4">{icon}</Text>}
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">
        {title}
      </Text>
      <Text className="text-base text-gray-500 text-center mb-6">
        {message}
      </Text>
      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} />
      )}
    </View>
  );
}
