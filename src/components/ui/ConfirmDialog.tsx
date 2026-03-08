import { View, Text, Pressable, Platform } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { setConfirmListener } from "@/utils/confirm";

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type DialogState = {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
};

const initialState: DialogState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export function ConfirmDialog() {
  const [state, setState] = useState<DialogState>(initialState);

  const dismiss = useCallback(() => {
    setState(initialState);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    setConfirmListener(setState);
    return () => setConfirmListener(null);
  }, []);

  if (Platform.OS !== "web" || !state.visible) return null;

  const handleButton = (button: AlertButton) => {
    dismiss();
    button.onPress?.();
  };

  return (
    <View className="absolute inset-0 z-[100]">
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={dismiss}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            accessibilityRole="alert"
            accessibilityViewIsModal={true}
            className="bg-white dark:bg-gray-800 rounded-2xl mx-4 overflow-hidden"
            style={{ maxWidth: 340, width: 340 }}
          >
            <View className="px-6 pt-5 pb-3">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">
                {state.title}
              </Text>
              {state.message ? (
                <Text className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                  {state.message}
                </Text>
              ) : null}
            </View>
            <View className="flex-row border-t border-gray-200 dark:border-gray-700">
              {state.buttons.map((button, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleButton(button)}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  className={`flex-1 py-3 items-center justify-center ${
                    index > 0
                      ? "border-l border-gray-200 dark:border-gray-700"
                      : ""
                  }`}
                  style={{ cursor: "pointer" as any }}
                >
                  <Text
                    className={`text-base font-semibold ${
                      button.style === "destructive"
                        ? "text-danger-500"
                        : button.style === "cancel"
                          ? "text-gray-500 dark:text-gray-400"
                          : "text-primary-600"
                    }`}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}
