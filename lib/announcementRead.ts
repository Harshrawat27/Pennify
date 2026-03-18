import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'spendler_last_announcement_read';

export async function getLastReadId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function markAnnouncementsRead(latestId: string): Promise<void> {
  await AsyncStorage.setItem(KEY, latestId);
}
