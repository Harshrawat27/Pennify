import { authClient } from '@/lib/auth-client';
import { useConvexAuth } from 'convex/react';

/**
 * Returns the userId only when both Better Auth session exists
 * AND the Convex JWT is ready. Use this instead of session?.user?.id
 * directly when passing userId to Convex queries/mutations.
 */
export function useAuthenticatedUserId(): string | undefined {
  const { data: session } = authClient.useSession();
  const { isAuthenticated } = useConvexAuth();
  if (!isAuthenticated || !session?.user?.id) return undefined;
  return session.user.id;
}
