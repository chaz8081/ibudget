import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 ${className}`}
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
      {...props}
    >
      {children}
    </View>
  );
}
