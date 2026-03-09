import { View } from "react-native";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <View className={`flex-1 w-full max-w-2xl mx-auto ${className}`.trim()}>
      {children}
    </View>
  );
}
