import { View, Text } from "react-native";

type SyncStatus = "offline" | "syncing" | "synced" | "error";

type SyncStatusBannerProps = {
  status: SyncStatus;
  lastSyncedAt?: string | null;
};

const statusConfig: Record<
  SyncStatus,
  { bg: string; text: string; label: string }
> = {
  offline: {
    bg: "bg-gray-500",
    text: "text-white",
    label: "Offline — changes saved locally",
  },
  syncing: {
    bg: "bg-primary-500",
    text: "text-white",
    label: "Syncing...",
  },
  synced: {
    bg: "bg-success-500",
    text: "text-white",
    label: "All changes synced",
  },
  error: {
    bg: "bg-danger-500",
    text: "text-white",
    label: "Sync error — will retry",
  },
};

export function SyncStatusBanner({ status, lastSyncedAt }: SyncStatusBannerProps) {
  // In local-only mode, don't show the banner
  if (status === "synced" && !lastSyncedAt) return null;

  const config = statusConfig[status];

  return (
    <View className={`px-4 py-2 ${config.bg}`}>
      <Text className={`text-sm font-medium text-center ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
