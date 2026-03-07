import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { useEffect } from "react";

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

  return (
    <View className="absolute inset-0 z-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className={`flex-1 bg-black/50 ${fullScreen ? "" : "justify-end"}`} onPress={onClose}>
          <Pressable onPress={(e) => e.stopPropagation()} className={fullScreen ? "flex-1" : ""}>
            <View className={fullScreen ? "flex-1 bg-white dark:bg-gray-900" : "bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85%]"}>
              <View className={`flex-row items-center justify-between px-6 border-b border-gray-100 dark:border-gray-700 ${fullScreen ? "pt-6 pb-4" : "pt-4 pb-3"}`}>
                <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</Text>
                <Pressable onPress={onAction ?? onClose} className="p-2">
                  <Text className="text-primary-600 text-base font-semibold">
                    {actionLabel ?? "Done"}
                  </Text>
                </Pressable>
              </View>
              {children}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}
