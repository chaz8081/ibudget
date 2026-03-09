import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  signUpSchema,
  type SignUpFormData,
} from "@/features/auth/schemas/auth.schema";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/PageContainer";
import { getErrorMessage } from "@/utils/errors";
import { showAlert } from "@/utils/confirm";

const allowSignup = process.env.EXPO_PUBLIC_ALLOW_SIGNUP === "true" ||
  process.env.EXPO_PUBLIC_AUTH_PROVIDER === "local";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

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
      const result = await signUp(data.email, data.password, data.displayName);
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
      }
    } catch (error) {
      showAlert("Sign Up Failed", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 justify-center px-6">
        <View className="items-center mb-10">
          <Text className="text-5xl mb-3">💰</Text>
          <Text className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            iBudget
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Check Your Email
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8">
            We sent a confirmation link to your email address. Please check your inbox and click the link to activate your account.
          </Text>
          <Link href="/sign-in" asChild>
            <Button title="Back to Sign In" variant="secondary" />
          </Link>
        </View>
      </View>
    );
  }

  if (!allowSignup) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 justify-center px-6">
        <View className="items-center mb-10">
          <Text className="text-5xl mb-3">💰</Text>
          <Text className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            iBudget
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Invite Only
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8">
            iBudget is currently in private beta. If you've received an invite, check your email for sign-in instructions.
          </Text>
          <Link href="/sign-in" asChild>
            <Button title="Back to Sign In" variant="secondary" />
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <PageContainer className="flex-none">
        <View className="mb-10 items-center" accessibilityLabel="iBudget, Start your budgeting journey">
          <Text className="text-5xl mb-3">💰</Text>
          <Text accessibilityRole="header" className="text-4xl font-bold text-gray-900 dark:text-gray-100">
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
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <FormField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          inputRef={emailRef}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <FormField
          control={control}
          name="password"
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          inputRef={passwordRef}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />

        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          secureTextEntry
          autoComplete="new-password"
          inputRef={confirmPasswordRef}
          returnKeyType="done"
          onSubmitEditing={handleSubmit(onSubmit)}
        />

        <Button
          title="Create Account"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
        />

        <View className="flex-row justify-center mt-6 gap-1">
          <Text className="text-gray-500 dark:text-gray-400">Already have an account?</Text>
          <Link href="/sign-in" accessibilityRole="link" accessibilityLabel="Sign In" className="text-primary-600 font-semibold">
            Sign In
          </Link>
        </View>
        </PageContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
