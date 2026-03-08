import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { usePowerSync } from "@powersync/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/forms/FormField";
import { PROFILES_TABLE } from "@/db/tables";
import { getErrorMessage } from "@/utils/errors";
import { useToast } from "@/contexts/ToastContext";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const { showToast } = useToast();
  const router = useRouter();
  const db = usePowerSync();
  const { user } = useAuth();
  const { profile } = useProfile();

  const { control, handleSubmit } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      displayName: profile?.display_name ?? "",
    },
    values: profile ? { displayName: profile.display_name ?? "" } : undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await db.execute(
        `UPDATE ${PROFILES_TABLE} SET display_name = ?, updated_at = ? WHERE id = ?`,
        [data.displayName.trim(), new Date().toISOString(), user.id]
      );
      showToast("Profile saved");
      router.back();
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4">
      {user?.email && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</Text>
          <Text className="text-base text-gray-500 dark:text-gray-400">{user.email}</Text>
        </View>
      )}
      <FormField
        control={control}
        name="displayName"
        label="Display Name"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <Button title="Save" onPress={onSubmit} isLoading={isLoading} />
    </View>
  );
}
