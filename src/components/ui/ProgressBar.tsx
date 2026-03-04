import { View } from "react-native";
import { getEnvelopeStatus, getEnvelopeProgress } from "@/features/budget/utils/budget-calculations";

type ProgressBarProps = {
  allocated: number;
  spent: number;
};

const statusColors = {
  under: "bg-success-500",
  warning: "bg-warning-500",
  over: "bg-danger-500",
};

export function ProgressBar({ allocated, spent }: ProgressBarProps) {
  const status = getEnvelopeStatus(allocated, spent);
  const progress = getEnvelopeProgress(allocated, spent);

  return (
    <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <View
        className={`h-full rounded-full ${statusColors[status]}`}
        style={{ width: `${progress * 100}%` }}
      />
    </View>
  );
}
