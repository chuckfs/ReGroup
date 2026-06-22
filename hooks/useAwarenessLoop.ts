import { useEffect, useRef } from 'react';

import {
  awarenessEngine,
  detectAwarenessEvents,
} from '@/services/awarenessEngine';
import { useUIStore } from '@/store/useUIStore';
import type { DeviceLocation } from '@/types/location';
import type { Friend } from '@/types';

/**
 * Watches live friend signals and pushes awareness events into the UI
 * store on state transitions only.
 */
export function useAwarenessLoop(
  friends: Friend[],
  friendLocations: Record<string, DeviceLocation>,
): void {
  const pushAwarenessEvent = useUIStore((s) => s.pushAwarenessEvent);
  const seededRef = useRef(false);
  const friendKeyRef = useRef('');

  const friendKey = friends.map((friend) => friend.id).join(',');

  useEffect(() => {
    if (friends.length === 0) return;

    if (friendKeyRef.current !== friendKey) {
      awarenessEngine.reset();
      seededRef.current = false;
      friendKeyRef.current = friendKey;
    }

    const events = detectAwarenessEvents(friends, friendLocations);

    if (!seededRef.current) {
      seededRef.current = true;
      return;
    }

    for (const event of events) {
      pushAwarenessEvent(event);
    }
  }, [friends, friendLocations, friendKey, pushAwarenessEvent]);
}
