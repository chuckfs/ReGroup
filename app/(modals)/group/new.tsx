import React, { useCallback } from 'react';
import { router } from 'expo-router';

import { CreateGroupScreen } from '@/features/group';
import { useGroupStore } from '@/store/useGroupStore';
import type { DraftGroup } from '@/types';

/**
 * Modal route: /group/new
 *
 * Presented as a sheet over the home map (see `presentation: 'modal'` in
 * the modals-group layout). On completion, the draft is persisted into
 * `useGroupStore`; the realtime backend will replace this with a server
 * mutation (TODO).
 */
export default function CreateGroupRoute() {
  const createGroup = useGroupStore((s) => s.createGroup);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  }, []);

  const handleComplete = useCallback(
    async (group: DraftGroup) => {
      try {
        await createGroup(group);
        handleClose();
      } catch (error) {
        console.error('[ReGroup] create session failed:', error);
      }
    },
    [createGroup, handleClose],
  );

  return (
    <CreateGroupScreen onClose={handleClose} onComplete={handleComplete} />
  );
}
