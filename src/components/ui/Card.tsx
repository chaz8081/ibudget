import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
