import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
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

// Routes that are valid when user is fully authenticated
const AUTHED_ROUTES = new Set(["(tabs)", "add-transaction", "add-budget", "add-goal", "currency-picker"]);

function useProtectedRoute(hasOnboarded: string | null, session: boolean, isPending: boolean) {
  const segments = useSegments();
  // Read segments inside the effect via a ref so it's always fresh
  // but doesn't trigger re-runs
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    if (isPending) return;

    const currentRoute = segmentsRef.current[0] ?? "";

    let targetRoute: string | null = null;

    if (!hasOnboarded) {
      if (currentRoute !== "onboarding" && currentRoute !== "sign-in") {
        targetRoute = "/onboarding";
      }
    } else if (hasOnboarded === "pending_auth" && !session) {
      if (currentRoute !== "sign-in") {
        targetRoute = "/sign-in?fromOnboarding=true";
      }
    } else if (hasOnboarded === "pending_auth" && session) {
      if (currentRoute !== "post-auth-setup") {
        targetRoute = "/post-auth-setup";
      }
    } else if (hasOnboarded === "true" && !session) {
      if (currentRoute !== "sign-in") {
        targetRoute = "/sign-in";
      }
    } else if (hasOnboarded === "true" && session) {
      if (!AUTHED_ROUTES.has(currentRoute)) {
        targetRoute = "/(tabs)";
      }
    }

    if (targetRoute) {
      console.log(`[Layout] navigating: ${currentRoute} → ${targetRoute} (hasOnboarded=${hasOnboarded}, session=${session})`);
      setTimeout(() => router.replace(targetRoute as any), 0);
    }
  }, [hasOnboarded, session, isPending]); // NO segments — only react to state changes
}

function RootLayoutNav() {
  const { data: session, isPending } = authClient.useSession();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  useProtectedRoute(hasOnboarded, !!session, isPending);

  if (isPending) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // Determine if we need SyncWrapper (only when session exists)
  const needsSync = !!session;
  const statusStyle = (!hasOnboarded || !session) ? "light" : "dark";

  const content = (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="post-auth-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" options={{ presentation: "modal" }} />
        <Stack.Screen name="add-budget" options={{ presentation: "modal" }} />
        <Stack.Screen name="add-goal" options={{ presentation: "modal" }} />
        <Stack.Screen name="currency-picker" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style={statusStyle} />
    </>
  );

  if (needsSync) {
    return <SyncWrapper>{content}</SyncWrapper>;
  }

  return content;
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
