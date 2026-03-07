import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permission from the OS.
 * On iOS, this triggers Apple's permission dialog (only once — subsequent
 * calls return the cached result).
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if notification permission is currently granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule or cancel the daily reminder notification.
 * Fires every day at 8 PM local time.
 */
export async function scheduleDailyReminder(enabled: boolean): Promise<void> {
  // Cancel any existing daily reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'daily_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Log your expenses',
      body: "Don't forget to track today's spending!",
      data: { type: 'daily_reminder' },
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

/**
 * Schedule or cancel the weekly report notification.
 * Fires every Sunday at 10 AM local time.
 */
export async function scheduleWeeklyReport(enabled: boolean): Promise<void> {
  // Cancel any existing weekly reports
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'weekly_report') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly spending report',
      body: 'Check how your week went!',
      data: { type: 'weekly_report' },
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 10,
      minute: 0,
    },
  });
}

/**
 * Schedule a monthly reminder the day before a recurring payment's billing day.
 * Uses the Convex payment ID as the notification identifier so it can be cancelled later.
 */
export async function scheduleRecurringReminder(paymentId: string, name: string, billingDay: number): Promise<void> {
  const reminderDay = Math.max(1, billingDay - 1);
  const clampedDay = Math.min(reminderDay, 28); // clamp so it fires in Feb too

  await Notifications.scheduleNotificationAsync({
    identifier: `recurring_${paymentId}`,
    content: {
      title: `${name} renews tomorrow`,
      body: `Your ${name} subscription will be charged tomorrow.`,
      data: { type: 'recurring_reminder', paymentId },
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: clampedDay,
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

/**
 * Cancel a recurring payment's reminder notification.
 */
export async function cancelRecurringReminder(paymentId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`recurring_${paymentId}`);
  } catch {
    // ignore if not found
  }
}

/**
 * Cancel all scheduled notifications (when user turns off master toggle).
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
