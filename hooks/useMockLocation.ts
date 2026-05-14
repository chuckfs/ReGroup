import { useEffect, useMemo, useState } from 'react';

import {
  mockLocationEngine,
  type LocationUpdate,
  type Movable,
} from '@/services/mockLocationEngine';
import type { Friend, MapPosition } from '@/types';

/**
 * Subscribe to the `mockLocationEngine` and return a fresh map of
 * `friendId → live position` for every friend passed in. Components plot
 * their markers against the value returned here; when the realtime layer
 * lands, swap the engine implementation and this hook keeps its same
 * shape.
 *
 * Usage:
 *
 *   const positions = useMockLocation(group.members);
 *   const friendPos = positions[friend.id] ?? friend.position;
 *
 * The hook seeds the engine with the supplied friends on mount and
 * subscribes for updates. It does **not** start the engine — the mock
 * drift loop is opt-in via `mockLocationEngine.start()`. By default
 * pins stay put and only re-render when their position is explicitly
 * updated, which mirrors how real GPS / realtime updates will behave.
 *
 * TODO(backend): replace with `useFriendPositions(groupId)` that pulls
 * from `useGroupStore` and subscribes to the realtime channel.
 */
export function useMockLocation(
  friends: Friend[],
): Record<string, MapPosition> {
  const movables = useMemo<Movable[]>(
    () =>
      friends.map((f) => ({
        id: f.id,
        position: f.position,
        status: f.status,
      })),
    [friends],
  );

  const [positions, setPositions] = useState<Record<string, MapPosition>>(() => {
    const out: Record<string, MapPosition> = {};
    for (const m of movables) out[m.id] = m.position;
    return out;
  });

  useEffect(() => {
    mockLocationEngine.seedAll(movables);

    const unsub = mockLocationEngine.subscribe((u: LocationUpdate) => {
      setPositions((prev) =>
        prev[u.friendId] &&
        prev[u.friendId].x === u.position.x &&
        prev[u.friendId].y === u.position.y
          ? prev
          : { ...prev, [u.friendId]: u.position },
      );
    });

    return () => {
      unsub();
    };
  }, [movables]);

  return positions;
}
