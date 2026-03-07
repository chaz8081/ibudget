import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
};

const TOAST_COLORS: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: Colors.success[500], text: Colors.white },
  error: { bg: Colors.danger[500], text: Colors.white },
  info: { bg: Colors.primary[600], text: Colors.white },
};

export function Toast({ message, type, onDismiss, duration = 3000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const colors = TOAST_COLORS[type];

  useEffect(() => {
    // Slide in
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    // Auto dismiss
    translateY.value = withDelay(
      duration,
      withTiming(-100, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      })
    );
    opacity.value = withDelay(duration, withTiming(0, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          backgroundColor: colors.bg,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          zIndex: 9999,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "center" }}>
        {message}
      </Text>
    </Animated.View>
  );
}
