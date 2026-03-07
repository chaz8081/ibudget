import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  signUpSchema,
  type SignUpFormData,
} from "@/features/auth/schemas/auth.schema";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/utils/errors";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.displayName);
      // LocalAuthProvider auto-signs in; AuthProvider (Supabase) may require email verification
    } catch (error) {
      Alert.alert("Sign Up Failed", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10 items-center">
          <Text className="text-5xl mb-3">💰</Text>
          <Text className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            iBudget
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-2">
            Start your budgeting journey
          </Text>
        </View>

        <FormField
          control={control}
          name="displayName"
          label="Display Name"
          placeholder="Your name"
          autoCapitalize="words"
          autoComplete="name"
        />

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
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
        />

        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          secureTextEntry
          autoComplete="new-password"
        />

        <Button
          title="Create Account"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
        />

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-gray-500 dark:text-gray-400">Already have an account?</Text>
          <Link href="/sign-in" className="text-primary-600 font-semibold">
            Sign In
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
