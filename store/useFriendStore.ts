import { create } from 'zustand';

import { findFriendById } from '@/services/mockData';
import type { Friend } from '@/types';

/**
 * Selected-friend state. Drives the friend detail modal (`/friend/[id]`)
 * and any "focus on this friend" affordances on the map (zoom-in, halo,
 * highlight in the sheet's friend list).
 *
 * Keeping `selectedFriendId` here (instead of just route state) means
 * the map and sheet can both react in sync without round-tripping
 * through the router.
 *
 * TODO(backend): `getById` becomes a selector against the realtime
 * group cache in `useGroupStore`, not a mock lookup.
 */

type FriendStore = {
  selectedFriendId: string | null;
  select: (id: string | null) => void;
  /** Convenience: resolve the currently-selected friend, if any. */
  getSelected: () => Friend | null;
};

export const useFriendStore = create<FriendStore>((set, get) => ({
  selectedFriendId: null,

  select: (id) => set({ selectedFriendId: id }),

  getSelected: () => {
    const id = get().selectedFriendId;
    if (!id) return null;
    return findFriendById(id) ?? null;
  },
}));
