import * as SecureStore from 'expo-secure-store';

const KEY = 'spendler_sub_status';

export async function getLocalSubscriptionStatus(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setLocalSubscriptionStatus(status: string | null): Promise<void> {
  try {
    if (status == null) {
      await SecureStore.deleteItemAsync(KEY);
    } else {
      await SecureStore.setItemAsync(KEY, status);
    }
  } catch {
    // SecureStore unavailable (simulator without keychain) — fail silently
  }
}
