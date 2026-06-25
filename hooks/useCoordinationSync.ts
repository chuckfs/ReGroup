import { useEffect } from 'react';

import {
  onCoordinationUpdate,
  onRallyCancelled,
  onRallyStarted,
} from '@/services/coordinationService';
import { useCoordinationStore } from '@/store/useCoordinationStore';

/**
 * Subscribes to coordination broadcasts and mirrors rally state into
 * `useCoordinationStore` while a session is active.
 */
export function useCoordinationSync(hasActiveSession: boolean): void {
  useEffect(() => {
    if (!hasActiveSession) return;

    onRallyStarted(({ rally }) => {
      useCoordinationStore.getState().setActiveRally(rally);
    });

    onRallyCancelled(({ rallyId }) => {
      const { activeRally, clearRally } = useCoordinationStore.getState();
      if (activeRally?.rallyId === rallyId) {
        clearRally();
      }
    });

    onCoordinationUpdate((update) => {
      useCoordinationStore.getState().applyCoordinationUpdate(update);
    });

    return () => {
      onRallyStarted(null);
      onRallyCancelled(null);
      onCoordinationUpdate(null);
    };
  }, [hasActiveSession]);
}
