import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { JoinSessionScreen } from '@/features/group';
import { useGroupStore } from '@/store/useGroupStore';

/**
 * Modal route: /join
 *
 * Manual invite-code entry when the user has no deep link.
 */
export default function JoinManualRoute() {
  const joinSession = useGroupStore((s) => s.joinSession);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      allowEdit
      onClose={handleClose}
      onJoin={handleJoin}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  );
}
