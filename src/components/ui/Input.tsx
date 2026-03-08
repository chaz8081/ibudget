import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useColorScheme } from "nativewind";
import { placeholderColor } from "@/constants/colors";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  compact?: boolean;
};

export const Input = forwardRef<TextInput, InputProps>(({ label, error, compact, ...props }, ref) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className={compact ? "mb-2.5" : "mb-4"}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</Text>
      )}
      <TextInput
        ref={ref}
        accessibilityLabel={label || props.placeholder}
        {...(error ? { accessibilityHint: error } : {})}
        className={`border rounded-xl px-4 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${
          compact ? "py-2.5" : "py-3"
        } ${error ? "border-danger-500" : "border-gray-300 dark:border-gray-500"}`}
        placeholderTextColor={placeholderColor(isDark)}
        {...props}
      />
      {error && (
        <Text className="text-sm text-danger-500 mt-1">{error}</Text>
      )}
    </View>
  );
});
Input.displayName = "Input";
