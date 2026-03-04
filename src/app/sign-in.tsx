import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  signInSchema,
  type SignInFormData,
} from "@/features/auth/schemas/auth.schema";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/utils/errors";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      Alert.alert("Sign In Failed", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text className="text-4xl font-bold text-gray-900 text-center">
            iBudget
          </Text>
          <Text className="text-base text-gray-500 text-center mt-2">
            Sign in to your account
          </Text>
        </View>

        <FormField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <FormField
          control={control}
          name="password"
          label="Password"
          placeholder="Your password"
          secureTextEntry
          autoComplete="password"
        />

        <Button
          title="Sign In"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
        />

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-gray-500">Don't have an account?</Text>
          <Link href="/sign-up" className="text-primary-600 font-semibold">
            Sign Up
          </Link>
        </View>

        <View className="flex-row justify-center mt-3">
          <Link
            href="/forgot-password"
            className="text-primary-600 font-semibold"
          >
            Forgot Password?
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
