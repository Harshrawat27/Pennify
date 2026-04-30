import * as SecureStore from 'expo-secure-store';

const getKey = (userId: string) => `spendler_sub_status_${userId}`;

export async function getLocalSubscriptionStatus(userId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(getKey(userId));
  } catch {
    return null;
  }
}

export async function setLocalSubscriptionStatus(userId: string, status: string | null): Promise<void> {
  try {
    if (status == null) {
      await SecureStore.deleteItemAsync(getKey(userId));
    } else {
      await SecureStore.setItemAsync(getKey(userId), status);
    }
  } catch {
    // SecureStore unavailable (simulator without keychain) — fail silently
  }
}
