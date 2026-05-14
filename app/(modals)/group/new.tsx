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
    (group: DraftGroup) => {
      // TODO(backend): replace with a server mutation that returns the
      // canonical group object (with server-assigned id, member roster,
      // initial vibe-specific config). For now we update the local store.
      createGroup(group);
      console.log('[ReGroup] new group:', group);
      handleClose();
    },
    [createGroup, handleClose],
  );

  return (
    <CreateGroupScreen onClose={handleClose} onComplete={handleComplete} />
  );
}
