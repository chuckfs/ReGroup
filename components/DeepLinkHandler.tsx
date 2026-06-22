import { useDeepLinkJoin } from '@/hooks/useDeepLinkJoin';

/**
 * Invisible listener for `regroup://join/{code}` after auth boot.
 */
export function DeepLinkHandler() {
  useDeepLinkJoin();
  return null;
}
