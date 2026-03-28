import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Returns isOnline:
 *   null  = unknown (initial, before first NetInfo response)
 *   true  = connected
 *   false = offline
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Subscribe first so we never miss a change
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });
    // Fetch immediately to get current state
    NetInfo.fetch().then((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  return { isOnline };
}
