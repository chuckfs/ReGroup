import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { normalizeInviteCode, parseJoinDeepLink } from '@/lib/deepLinks';
import { useGroupStore } from '@/store/useGroupStore';

type JoinNavigation = 'navigate' | 'ignore' | 'blocked';

function resolveJoinNavigation(code: string): JoinNavigation {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return 'ignore';

  const { hasActiveSession, active } = useGroupStore.getState();

  if (!hasActiveSession) return 'navigate';

  if (
    active.inviteCode &&
    normalizeInviteCode(active.inviteCode) === normalized
  ) {
    return 'ignore';
  }

  return 'blocked';
}

export function openJoinFromDeepLink(code: string): void {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return;

  const action = resolveJoinNavigation(normalized);

  if (action === 'ignore') return;

  if (action === 'blocked') {
    Alert.alert(
      'Already in a night',
      'End your current night before joining another session.',
    );
    return;
  }

  router.push(`/join/${encodeURIComponent(normalized)}` as never);
}

/**
 * Cold-start + warm URL handling for `regroup://join/{code}`.
 * Runs after auth boot (`isBootstrapped`).
 */
export function useDeepLinkJoin(): void {
  const isBootstrapped = useGroupStore((s) => s.isBootstrapped);
  const initialHandled = useRef(false);

  const processUrl = useCallback((url: string | null) => {
    if (!url) return;
    const code = parseJoinDeepLink(url);
    if (!code) return;
    openJoinFromDeepLink(code);
  }, []);

  useEffect(() => {
    if (!isBootstrapped) return;

    if (!initialHandled.current) {
      initialHandled.current = true;
      void Linking.getInitialURL().then(processUrl);
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      processUrl(url);
    });

    return () => subscription.remove();
  }, [isBootstrapped, processUrl]);
}
