import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'spendler_tx_queue';

export interface QueuedTransaction {
  localId: string;
  userId: string;
  title: string;
  amount: number;    // already signed: negative for expense
  note: string;
  date: string;      // 'YYYY-MM-DD'
  categoryId: string;
  accountId: string;
  // Display info stored so UI can render without Convex
  categoryName: string;
  categoryIcon: string;
  accountName: string;
  accountIcon: string;
  createdAt: string; // ISO timestamp
  retries: number;
  receiptUrl?: string; // Cloudflare R2 URL if scanned from receipt
  isBookmarked?: boolean;
}

async function readQueue(): Promise<QueuedTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedTransaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function getQueue(): Promise<QueuedTransaction[]> {
  return readQueue();
}

export async function enqueue(tx: QueuedTransaction): Promise<void> {
  const queue = await readQueue();
  queue.push(tx);
  await writeQueue(queue);
}

export async function dequeue(localId: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.localId !== localId));
}

export async function incrementRetry(localId: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(
    queue.map((item) =>
      item.localId === localId ? { ...item, retries: item.retries + 1 } : item
    )
  );
}
