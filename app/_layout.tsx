import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ExpenseProvider } from "../components/ExpenseContext";

export default function RootLayout() {
  return (
    <ExpenseProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </ExpenseProvider>
  );
}
