import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useColorScheme } from "nativewind";
import { placeholderColor } from "@/constants/colors";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...props }: InputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</Text>
      )}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${
          error ? "border-danger-500" : "border-gray-300 dark:border-gray-500"
        }`}
        placeholderTextColor={placeholderColor(isDark)}
        {...props}
      />
      {error && (
        <Text className="text-sm text-danger-500 mt-1">{error}</Text>
      )}
    </View>
  );
}
