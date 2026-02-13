import { authClient } from "@/lib/auth-client";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (isSignUp && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      console.log("[Auth] baseURL:", process.env.EXPO_PUBLIC_AUTH_URL);
      if (isSignUp) {
        console.log("[Auth] Signing up with email:", email.trim());
        const result = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        });
        console.log("[Auth] SignUp result:", JSON.stringify(result, null, 2));
        if (result.error) {
          setError(result.error.message ?? "Could not create account");
          return;
        }
      } else {
        console.log("[Auth] Signing in with email:", email.trim());
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        console.log("[Auth] SignIn result:", JSON.stringify(result, null, 2));
        if (result.error) {
          setError(result.error.message ?? "Invalid email or password");
          return;
        }
      }
    } catch (e: unknown) {
      console.error("[Auth] Error:", e);
      console.error("[Auth] Error details:", JSON.stringify(e, Object.getOwnPropertyNames(e as object)));
      setError(isSignUp ? "Could not create account" : "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      console.log("[Auth] Starting Google sign-in...");
      console.log("[Auth] baseURL:", process.env.EXPO_PUBLIC_AUTH_URL);
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      console.log("[Auth] Google result:", JSON.stringify(result, null, 2));
    } catch (e: unknown) {
      console.error("[Auth] Google error:", e);
      console.error("[Auth] Google error details:", JSON.stringify(e, Object.getOwnPropertyNames(e as object)));
      setError("Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        className="flex-1 justify-between px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
      >
        {/* Top: Branding */}
        <View className="items-center mt-20">
          <View className="w-20 h-20 rounded-3xl bg-white items-center justify-center mb-6">
            <Feather name="dollar-sign" size={36} color="#000" />
          </View>
          <Text className="text-white text-[32px] font-bold tracking-tight">
            Pennify
          </Text>
          <Text className="text-neutral-500 text-[16px] mt-2 text-center leading-6">
            Track your money.{"\n"}Build your future.
          </Text>
        </View>

        {/* Bottom: Form */}
        <View className="gap-4">
          {error ? (
            <View className="bg-red-500/10 rounded-xl px-4 py-3">
              <Text className="text-red-400 text-[13px] text-center">
                {error}
              </Text>
            </View>
          ) : null}

          {isSignUp ? (
            <TextInput
              className="bg-neutral-900 text-white text-[15px] rounded-2xl px-5 py-4"
              placeholder="Name"
              placeholderTextColor="#525252"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
          ) : null}

          <TextInput
            className="bg-neutral-900 text-white text-[15px] rounded-2xl px-5 py-4"
            placeholder="Email"
            placeholderTextColor="#525252"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            className="bg-neutral-900 text-white text-[15px] rounded-2xl px-5 py-4"
            placeholder="Password"
            placeholderTextColor="#525252"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            className="bg-white rounded-2xl py-4 flex-row items-center justify-center gap-3"
            style={({ pressed }) => ({
              opacity: pressed || busy ? 0.6 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : null}
            <Text className="text-black text-[16px] font-semibold">
              {isLoading
                ? "Please wait..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center gap-4">
            <View className="flex-1 h-px bg-neutral-800" />
            <Text className="text-neutral-600 text-[12px]">OR</Text>
            <View className="flex-1 h-px bg-neutral-800" />
          </View>

          {/* Google */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={busy}
            className="border border-neutral-800 rounded-2xl py-4 flex-row items-center justify-center gap-3"
            style={({ pressed }) => ({
              opacity: pressed || busy ? 0.6 : 1,
            })}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="chrome" size={20} color="#fff" />
            )}
            <Text className="text-white text-[16px] font-semibold">
              {isGoogleLoading ? "Please wait..." : "Continue with Google"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
          >
            <Text className="text-neutral-500 text-[14px] text-center">
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Create one"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
