import { View, Text, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Modal } from "@/components/ui/Modal";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type CategoryPickerProps = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showAll?: boolean;
};

export function CategoryPicker({
  visible,
  onClose,
  categories,
  selectedId,
  onSelect,
  showAll = false,
}: CategoryPickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const items: { id: string | null; name: string; icon: string | null }[] = [
    ...(showAll ? [{ id: null, name: "All Categories", icon: null }] : []),
    ...categories,
  ];

  return (
    <Modal visible={visible} onClose={onClose} title="Select Category">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? "all"}
        contentContainerClassName="px-6 pb-6"
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          return (
            <Pressable
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
              className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-700"
            >
              {item.icon ? (
                <Text className="text-lg mr-3">{item.icon}</Text>
              ) : (
                <View className="w-6 mr-3" />
              )}
              <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">
                {item.name}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={22}
                  color={isDark ? "#60a5fa" : "#2563eb"}
                />
              )}
            </Pressable>
          );
        }}
      />
    </Modal>
  );
}
