import React, { useCallback, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { JoinSessionScreen } from '@/features/group';
import { normalizeInviteCode } from '@/lib/deepLinks';
import { useGroupStore } from '@/store/useGroupStore';

/**
 * Modal route: /join/BKLY-7G3X
 *
 * Opened from deep links or after manual code entry.
 */
export default function JoinSessionRoute() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const joinSession = useGroupStore((s) => s.joinSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inviteCode = useMemo(() => {
    const raw = Array.isArray(code) ? code[0] : code;
    return normalizeInviteCode(raw ?? '');
  }, [code]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  }, []);

  const handleJoin = useCallback(
    async (invite: string) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await joinSession(invite);
        router.replace('/(tabs)' as never);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not join session';
        setSubmitError(message);
        console.error('[ReGroup] join session failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [joinSession],
  );

  return (
    <JoinSessionScreen
      initialCode={inviteCode}
      onClose={handleClose}
      onJoin={handleJoin}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  );
}
