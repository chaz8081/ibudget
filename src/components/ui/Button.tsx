import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import { useColorScheme } from "nativewind";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const variantStyles: Record<ButtonVariant, { container: string; text: string }> =
  {
    primary: {
      container: "bg-primary-600 active:bg-primary-700",
      text: "text-white",
    },
    secondary: {
      container: "bg-gray-200 dark:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600",
      text: "text-gray-900 dark:text-gray-100",
    },
    danger: {
      container: "bg-danger-500 active:bg-danger-600",
      text: "text-white",
    },
    ghost: {
      container: "bg-transparent active:bg-gray-100 dark:active:bg-gray-800",
      text: "text-primary-600",
    },
  };

export function Button({
  title,
  variant = "primary",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = variantStyles[variant];
  const isDisabled = disabled || isLoading;

  const spinnerColor =
    variant === "secondary" || variant === "ghost"
      ? isDark
        ? "#93c5fd"
        : "#1e40af"
      : "#fff";

  return (
    <Pressable
      className={`rounded-xl px-6 py-4 items-center justify-center ${styles.container} ${
        isDisabled ? "opacity-50" : ""
      }`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text className={`text-base font-semibold ${styles.text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
