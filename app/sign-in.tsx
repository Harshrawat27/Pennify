import { authClient } from "@/lib/auth-client";
import { convex } from "@/lib/convex";
import { useSettingsStore } from "@/lib/stores/useSettingsStore";
import { api } from "@/convex/_generated/api";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { fromOnboarding } = useLocalSearchParams<{ fromOnboarding?: string }>();
  const isFromOnboarding = fromOnboarding === 'true';

  const { data: session } = authClient.useSession();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [error, setError] = useState("");

  // Navigate away once session appears (sign-in succeeded)
  useEffect(() => {
    if (!session) return;

    console.log('[SignIn] Session established:', {
      userId: session.user.id,
      email: session.user.email,
      hasOnboarded,
    });

    // Came from completing onboarding flow → subscription/trial setup
    if (hasOnboarded === 'pending_auth') {
      console.log('[SignIn] hasOnboarded=pending_auth → /post-auth-setup');
      router.replace('/post-auth-setup');
      return;
    }

    // Check Convex cloud for existing data to distinguish new vs returning users.
    // This is more reliable than createdAt timestamps — works even when someone
    // creates an account on Device 1 and immediately opens Device 2.
    setIsCheckingCloud(true);
    convex.query(api.sync.pullAll, { userId: session.user.id })
      .then((data) => {
        const hasCloudData = Boolean(
          data && (
            data.accounts.length > 0 ||
            data.transactions.length > 0 ||
            data.categories.length > 0
          )
        );

        console.log('[SignIn] Cloud check — hasCloudData:', hasCloudData);

        if (!hasCloudData) {
          console.log('[SignIn] No cloud data → new user → /onboarding');
          router.replace('/onboarding');
        } else {
          console.log('[SignIn] Has cloud data → returning user → /(tabs)');
          if (!hasOnboarded) {
            useSettingsStore.getState().setHasOnboarded('true');
          }
          router.replace('/(tabs)');
        }
      })
      .catch((e) => {
        // Network error during check — fall back to hasOnboarded value
        console.warn('[SignIn] Cloud check failed, falling back:', e);
        if (!hasOnboarded) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      })
      .finally(() => setIsCheckingCloud(false));
  }, [session]);

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (e: unknown) {
      console.error("[Auth] Google error:", e);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Full-screen overlay while we check Convex cloud after sign-in
  if (isCheckingCloud) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-neutral-500 text-[14px] mt-4">Checking your account…</Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-black justify-between px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
    >
      {/* Top: Branding */}
      <View className="items-center mt-20">
        <View className="w-20 h-20 rounded-3xl bg-white items-center justify-center mb-6">
          <Feather name="dollar-sign" size={36} color="#000" />
        </View>
        <Text className="text-white text-[32px] font-bold tracking-tight">
          {isFromOnboarding ? "Save Your Progress" : "Pennify"}
        </Text>
        <Text className="text-neutral-500 text-[16px] mt-2 text-center leading-6">
          {isFromOnboarding
            ? "Sign in to sync your data\nacross devices."
            : "Track your money.\nBuild your future."}
        </Text>
      </View>

      {/* Bottom: Google Sign In */}
      <View className="gap-4">
        {error ? (
          <View className="bg-red-500/10 rounded-xl px-4 py-3">
            <Text className="text-red-400 text-[13px] text-center">
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          className="bg-white rounded-2xl py-4 flex-row items-center justify-center gap-3"
          style={({ pressed }) => ({
            opacity: pressed || isLoading ? 0.6 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Feather name="chrome" size={20} color="#000" />
          )}
          <Text className="text-black text-[16px] font-semibold">
            {isLoading ? "Please wait..." : "Continue with Google"}
          </Text>
        </Pressable>

        <Text className="text-neutral-600 text-[12px] text-center leading-5">
          By continuing, you agree to our{"\n"}Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}
