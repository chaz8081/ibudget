import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

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
      container: "bg-gray-200 active:bg-gray-300",
      text: "text-gray-900",
    },
    danger: {
      container: "bg-danger-500 active:bg-danger-600",
      text: "text-white",
    },
    ghost: {
      container: "bg-transparent active:bg-gray-100",
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
  const styles = variantStyles[variant];
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`rounded-xl px-6 py-4 items-center justify-center ${styles.container} ${
        isDisabled ? "opacity-50" : ""
      }`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "secondary" || variant === "ghost" ? "#1e40af" : "#fff"}
        />
      ) : (
        <Text className={`text-base font-semibold ${styles.text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
