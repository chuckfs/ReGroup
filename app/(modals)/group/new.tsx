import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { CreateGroupScreen } from '@/features/group';
import { useGroupStore } from '@/store/useGroupStore';
import type { DraftGroup } from '@/types';

/**
 * Modal route: /group/new
 *
 * On completion, creates a server session via `useGroupStore.createGroup`.
 */
export default function CreateGroupRoute() {
  const createGroup = useGroupStore((s) => s.createGroup);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  }, []);

  const handleComplete = useCallback(
    async (group: DraftGroup) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await createGroup(group);
        handleClose();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not create session';
        setSubmitError(message);
        console.error('[ReGroup] create session failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createGroup, handleClose],
  );

  return (
    <CreateGroupScreen
      onClose={handleClose}
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  );
}
