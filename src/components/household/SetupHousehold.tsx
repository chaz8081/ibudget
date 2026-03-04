import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { getErrorMessage } from "@/utils/errors";

export function SetupHousehold() {
  const { createHousehold, joinHousehold } = useHousehold();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await createHousehold(name.trim());
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setIsLoading(true);
    try {
      await joinHousehold(inviteCode.trim());
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "create") {
    return (
      <View className="flex-1 bg-gray-50 justify-center px-6">
        <Card>
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Create a Household
          </Text>
          <Input
            label="Household Name"
            placeholder="e.g., The Smith Family"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Button title="Create" onPress={handleCreate} isLoading={isLoading} />
          <Button
            title="Back"
            variant="ghost"
            onPress={() => setMode("choose")}
          />
        </Card>
      </View>
    );
  }

  if (mode === "join") {
    return (
      <View className="flex-1 bg-gray-50 justify-center px-6">
        <Card>
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Join a Household
          </Text>
          <Input
            label="Invite Code"
            placeholder="Enter invite code"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="none"
            autoFocus
          />
          <Button title="Join" onPress={handleJoin} isLoading={isLoading} />
          <Button
            title="Back"
            variant="ghost"
            onPress={() => setMode("choose")}
          />
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 justify-center px-6">
      <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
        Welcome to iBudget
      </Text>
      <Text className="text-base text-gray-500 text-center mb-8">
        Create or join a household to start budgeting
      </Text>
      <Button title="Create a Household" onPress={() => setMode("create")} />
      <View className="h-3" />
      <Button
        title="Join with Invite Code"
        variant="secondary"
        onPress={() => setMode("join")}
      />
    </View>
  );
}
