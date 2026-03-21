import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
} from 'react-native-purchases';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

export function initializePurchases(userId: string) {
  if (Platform.OS !== 'ios') return;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: IOS_KEY, appUserID: userId });
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('[RevenueCat] getOfferings failed:', e);
    return null;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.restorePurchases();
  } catch (e) {
    console.error('[RevenueCat] restorePurchases failed:', e);
    return null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.error('[RevenueCat] getCustomerInfo failed:', e);
    return null;
  }
}

export type SubStatus = 'none' | 'monthly' | 'yearly' | 'expired';

export function getStatusFromCustomerInfo(info: CustomerInfo): SubStatus {
  const active = info.entitlements.active['Spendler Pro'];
  if (active) {
    const id = active.productIdentifier ?? '';
    if (id.includes('yearly')) return 'yearly';
    if (id.includes('monthly')) return 'monthly';
    return 'yearly'; // fallback for any active pro entitlement
  }
  const all = info.entitlements.all['Spendler Pro'];
  if (all) return 'expired';
  return 'none';
}
