import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  useWindowDimensions,
} from "react-native";
import { useEffect } from "react";

const DESKTOP_BREAKPOINT = 640;
const DESKTOP_MAX_WIDTH = 480;

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  fullScreen?: boolean;
};

export function Modal({ visible, onClose, title, children, actionLabel, onAction, fullScreen = false }: ModalProps) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= DESKTOP_BREAKPOINT;
  const isCentered = isDesktopWeb && !fullScreen;

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  const backdropClass = fullScreen
    ? "flex-1 bg-black/50"
    : isCentered
      ? "flex-1 bg-black/50 justify-center items-center"
      : "flex-1 bg-black/50 justify-end";

  const modalContainerClass = fullScreen
    ? "flex-1 bg-white dark:bg-gray-900"
    : isCentered
      ? "bg-white dark:bg-gray-900 rounded-2xl max-h-[85%] flex-col"
      : "bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85%] flex-col";

  return (
    <View className="absolute inset-0 z-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className={backdropClass} onPress={onClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={fullScreen ? "flex-1" : ""}
            style={isCentered ? { maxWidth: DESKTOP_MAX_WIDTH, width: "100%" } : undefined}
          >
            <View className={modalContainerClass}>
              <View className={`flex-row items-center justify-between px-6 border-b border-gray-100 dark:border-gray-700 ${fullScreen ? "pt-6 pb-4" : "pt-4 pb-3"}`}>
                <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</Text>
                <Pressable
                  onPress={onAction ?? onClose}
                  className="p-3"
                  style={Platform.OS === "web" ? { cursor: "pointer" } : undefined}
                >
                  <Text className="text-primary-600 text-base font-semibold">
                    {actionLabel ?? "Done"}
                  </Text>
                </Pressable>
              </View>
              <View className="flex-1 overflow-hidden">
                {children}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}
