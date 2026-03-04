import { View } from "react-native";

type SyncIndicatorProps = {
  status: "offline" | "syncing" | "synced" | "error";
};

const dotColors = {
  offline: "bg-gray-400",
  syncing: "bg-primary-500",
  synced: "bg-success-500",
  error: "bg-danger-500",
};

export function SyncIndicator({ status }: SyncIndicatorProps) {
  return (
    <View className={`w-2.5 h-2.5 rounded-full ${dotColors[status]}`} />
  );
}
