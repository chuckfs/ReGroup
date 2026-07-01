import React, { useCallback } from 'react';
import { router } from 'expo-router';

import { RegroupNavScreenRoute } from '@/features/coordination/screens/RegroupNavScreen';
import { respondToRally } from '@/services/coordinationService';
import { useCoordinationStore } from '@/store/useCoordinationStore';

/**
 * Modal route: /regroup/nav
 */
export default function RegroupNavRoute() {
  const activeRally = useCoordinationStore((s) => s.activeRally);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  }, []);

  const handleMarkArrived = useCallback(async () => {
    if (!activeRally) return;

    try {
      await respondToRally(activeRally.rallyId, 'at_meeting_point');
      handleClose();
    } catch (err) {
      console.error('[ReGroup] mark arrived failed:', err);
    }
  }, [activeRally, handleClose]);

  return (
    <RegroupNavScreenRoute
      rally={activeRally}
      onClose={handleClose}
      onMarkArrived={handleMarkArrived}
    />
  );
}
