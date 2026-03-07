import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function Modal({ visible, onClose, title, children, actionLabel, onAction }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85%]">
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</Text>
              <Pressable onPress={onAction ?? onClose} className="p-2">
                <Text className="text-primary-600 text-base font-semibold">
                  {actionLabel ?? "Done"}
                </Text>
              </Pressable>
            </View>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
