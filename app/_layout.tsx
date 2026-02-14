import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { ConvexAuthSetup } from "@/lib/auth/ConvexAuthSetup";
import { authClient } from "@/lib/auth-client";
import { useDatabase } from "@/lib/hooks/useDatabase";
import { useSyncEngine } from "@/lib/sync/useSyncEngine";
import { useSettingsStore } from "@/lib/stores/useSettingsStore";
import "../global.css";

function SyncWrapper({ children }: { children: React.ReactNode }) {
  useSyncEngine();
  return <>{children}</>;
}

function RootLayoutNav() {
  const { data: session, isPending } = authClient.useSession();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  if (isPending) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // Fresh install — no onboarding done
  if (!hasOnboarded) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="sign-in" />
        </Stack>
        <Redirect href="/onboarding" />
        <StatusBar style="light" />
      </>
    );
  }

  // Onboarding done, waiting for auth
  if (hasOnboarded === 'pending_auth' && !session) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="sign-in" />
        </Stack>
        <Redirect href="/sign-in?fromOnboarding=true" />
        <StatusBar style="light" />
      </>
    );
  }

  // Onboarding done, just signed in — show post-auth setup
  if (hasOnboarded === 'pending_auth' && session) {
    return (
      <SyncWrapper>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="post-auth-setup" />
        </Stack>
        <Redirect href="/post-auth-setup" />
        <StatusBar style="dark" />
      </SyncWrapper>
    );
  }

  // Not signed in but already onboarded
  if (!session) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="sign-in" />
        </Stack>
        <Redirect href="/sign-in" />
        <StatusBar style="light" />
      </>
    );
  }

  // Fully onboarded + signed in
  return (
    <SyncWrapper>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-transaction"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="add-budget" options={{ presentation: "modal" }} />
        <Stack.Screen name="add-goal" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="currency-picker"
          options={{ presentation: "modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </SyncWrapper>
  );
}

export default function RootLayout() {
  const isReady = useDatabase();

  if (!isReady) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <ConvexAuthSetup>
      <RootLayoutNav />
    </ConvexAuthSetup>
  );
}
