import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { ConvexAuthSetup } from "@/lib/auth/ConvexAuthSetup";
import { authClient } from "@/lib/auth-client";
import { useDatabase } from "@/lib/hooks/useDatabase";
import { useSyncEngine } from "@/lib/sync/useSyncEngine";
import "../global.css";

function SyncWrapper({ children }: { children: React.ReactNode }) {
  useSyncEngine();
  return <>{children}</>;
}

function RootLayoutNav() {
  const { data: session, isPending, error } = authClient.useSession();

  console.log("[Layout] session state:", { isPending, hasSession: !!session, error: error?.message ?? null });
  if (session) {
    console.log("[Layout] user:", session.user?.email);
  }

  if (isPending) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

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
