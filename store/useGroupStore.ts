import { create } from 'zustand';

import { mockGroup } from '@/services/mockData';
import type { DraftGroup, Group, GroupVibeKey } from '@/types';

/**
 * The "active group" the user is currently looking at. Today we boot
 * from the mock group; once auth + backend land this store becomes the
 * canonical client cache for the user's groups.
 *
 * ─── Production swap ────────────────────────────────────────────────
 * TODO(backend):
 *   - Replace the `setActive(mockGroup)` boot path with a
 *     `loadActiveGroup(groupId)` thunk that hits Supabase and
 *     subscribes to the realtime channel.
 *   - Move `createGroup` to issue a server mutation, then `setActive`
 *     the returned canonical group (with server-assigned id).
 *   - Add `groups: Record<id, Group>` for the multi-group switcher.
 */

type GroupStore = {
  /** The group the home map is currently rendering. */
  active: Group;
  setActive: (group: Group) => void;
  /** Update only the vibe (cheap UI affordance — wizard restyle). */
  setVibeKey: (key: GroupVibeKey) => void;
  /** Persist a new group built by the wizard. */
  createGroup: (draft: DraftGroup) => void;
};

export const useGroupStore = create<GroupStore>((set) => ({
  active: mockGroup,

  setActive: (group) => set({ active: group }),

  setVibeKey: (key) =>
    set((s) => ({
      active: { ...s.active, vibeKey: key },
    })),

  createGroup: (draft) =>
    set((s) => ({
      active: {
        ...s.active,
        // Today this just retints the active group with the new draft.
        // TODO(backend): replace with a server-created group object.
        id: `grp_${Date.now().toString(36)}`,
        name: draft.name,
        vibeKey: draft.vibeKey,
        inviteCode: draft.inviteCode,
      },
    })),
}));

/** Selector helper — read just the member list. */
export const selectMembers = (s: GroupStore) => s.active.members;
/** Selector helper — read just the active group's id. */
export const selectActiveGroupId = (s: GroupStore) => s.active.id;
