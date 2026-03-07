import { useState } from "react";
import { View, Alert } from "react-native";
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
      <FormField
        control={control}
        name="displayName"
        label="Display Name"
        autoFocus
      />
      <Button title="Save" onPress={onSubmit} isLoading={isLoading} />
    </View>
  );
}
