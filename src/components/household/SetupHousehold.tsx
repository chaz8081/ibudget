import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/forms/FormField";
import { useHousehold } from "@/features/household/hooks/useHousehold";
import { getErrorMessage } from "@/utils/errors";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const joinSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

type CreateFormData = z.infer<typeof createSchema>;
type JoinFormData = z.infer<typeof joinSchema>;

export function SetupHousehold() {
  const { createHousehold, joinHousehold } = useHousehold();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [isLoading, setIsLoading] = useState(false);

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    mode: "onBlur",
    defaultValues: { name: "" },
  });

  const joinForm = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    mode: "onBlur",
    defaultValues: { inviteCode: "" },
  });

  const handleCreate = createForm.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await createHousehold(data.name.trim());
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  });

  const handleJoin = joinForm.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await joinHousehold(data.inviteCode.trim());
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  });

  if (mode === "create") {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 justify-center px-6">
        <Card>
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Create a Household
          </Text>
          <FormField
            control={createForm.control}
            name="name"
            label="Household Name"
            placeholder="e.g., The Smith Family"
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
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 justify-center px-6">
        <Card>
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Join a Household
          </Text>
          <FormField
            control={joinForm.control}
            name="inviteCode"
            label="Invite Code"
            placeholder="Enter invite code"
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 justify-center px-6">
      <Text className="text-6xl text-center mb-4">💰</Text>
      <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
        Welcome to iBudget
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8">
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
