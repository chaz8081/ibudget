import { View, Text, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Modal } from "@/components/ui/Modal";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type SingleSelectProps = {
  multiSelect?: false;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  selectedIds?: never;
  onToggle?: never;
};

type MultiSelectProps = {
  multiSelect: true;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  selectedId?: never;
  onSelect?: never;
};

type CategoryPickerProps = {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  showAll?: boolean;
} & (SingleSelectProps | MultiSelectProps);

export function CategoryPicker(props: CategoryPickerProps) {
  const { visible, onClose, categories, showAll = false, multiSelect } = props;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const allSelected = multiSelect
    ? props.selectedIds.size === 0 || props.selectedIds.size === categories.length
    : false;

  const items: { id: string | null; name: string; icon: string | null }[] = [
    ...(showAll ? [{ id: null, name: "All Categories", icon: null }] : []),
    ...categories,
  ];

  const isSelected = (id: string | null): boolean => {
    if (multiSelect) {
      if (id === null) return allSelected;
      return props.selectedIds.size === 0 || props.selectedIds.has(id);
    }
    return id === props.selectedId;
  };

  const handlePress = (id: string | null) => {
    if (multiSelect) {
      if (id === null) {
        // Pressing "All" resets to empty set (= all selected)
        categories.forEach((c) => {
          if (props.selectedIds.has(c.id)) {
            props.onToggle(c.id);
          }
        });
      } else {
        props.onToggle(id);
      }
    } else {
      props.onSelect(id);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Select Category"
      actionLabel={multiSelect ? "Done" : undefined}
      onAction={multiSelect ? onClose : undefined}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id ?? "all"}
        contentContainerClassName="px-6 pb-6"
        renderItem={({ item }) => {
          const selected = isSelected(item.id);
          return (
            <Pressable
              onPress={() => handlePress(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              accessibilityState={{ selected }}
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
              {selected && (
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
