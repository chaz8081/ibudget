import { useState, useCallback } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { usePowerSync } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PROFILES_TABLE } from "@/db/tables";
import { getErrorMessage } from "@/utils/errors";
import { useToast } from "@/contexts/ToastContext";

export default function ProfileScreen() {
  const { showToast } = useToast();
  const router = useRouter();
  const db = usePowerSync();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!user || !displayName.trim()) return;
    setIsLoading(true);
    try {
      await db.execute(
        `UPDATE ${PROFILES_TABLE} SET display_name = ?, updated_at = ? WHERE id = ?`,
        [displayName.trim(), new Date().toISOString(), user.id]
      );
      showToast("Profile saved");
      router.back();
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [db, user, displayName, router]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 px-4 pt-4">
      <Input
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        autoFocus
      />
      <Button title="Save" onPress={handleSave} isLoading={isLoading} />
    </View>
  );
}
