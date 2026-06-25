import { useEffect, useState } from 'react';

import { useCoordinationStore } from '@/store/useCoordinationStore';
import { useGroupStore } from '@/store/useGroupStore';

/**
 * Re-renders when the initiator's no-response deadline elapses so roster
 * rows can show `no_response` for silent members.
 */
export function useRallyResponseTimeout(hasActiveSession: boolean): void {
  const activeRally = useCoordinationStore((s) => s.activeRally);
  const responseDeadline = useCoordinationStore((s) => s.responseDeadline);
  const currentUserId = useGroupStore((s) => s.active.user.id);
  const [, setTick] = useState(0);

  const isInitiator =
    hasActiveSession &&
    activeRally != null &&
    activeRally.initiatorUserId === currentUserId;

  useEffect(() => {
    if (!isInitiator || !responseDeadline) return;

    const remaining = responseDeadline - Date.now();
    if (remaining <= 0) {
      setTick((value) => value + 1);
      return;
    }

    const timer = setTimeout(() => {
      setTick((value) => value + 1);
    }, remaining);

    return () => clearTimeout(timer);
  }, [isInitiator, responseDeadline, activeRally?.rallyId]);
}
