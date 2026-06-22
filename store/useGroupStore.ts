import { create } from 'zustand';

import { isRealSessionId, clearActiveSessionId, persistActiveSessionId, readActiveSessionId } from '@/lib/sessionStorage';
import { getUserId } from '@/services/authService';
import { mockGroup } from '@/services/mockData';
import {
  createSession,
  endSession as endSessionOnServer,
  getSession,
  joinSession as joinSessionOnServer,
  leaveSessionChannel,
  onRosterChanged,
  onSessionEnded,
} from '@/services/sessionService';
import type { DraftGroup, Group, GroupVibeKey } from '@/types';

const idleGroup: Group = {
  id: 'idle',
  name: 'ReGroup',
  vibe: 'Start a night',
  members: [],
  user: {
    id: 'pending',
    name: 'You',
    initials: 'YOU',
    batteryPercent: 100,
    status: 'with_group',
  },
};

function getIdleGroup(): Group {
  return __DEV__ ? mockGroup : idleGroup;
}

async function hydrateIdleUser(group: Group): Promise<Group> {
  try {
    const userId = await getUserId();
    return {
      ...group,
      user: { ...group.user, id: userId },
    };
  } catch {
    return group;
  }
}

type GroupStore = {
  active: Group;
  hasActiveSession: boolean;
  isBootstrapped: boolean;
  setActive: (group: Group) => void;
  setVibeKey: (key: GroupVibeKey) => void;
  createGroup: (draft: DraftGroup) => Promise<void>;
  joinSession: (inviteCode: string) => Promise<void>;
  applyGroupSnapshot: (group: Group) => void;
  restoreActiveSession: () => Promise<void>;
  endSession: () => Promise<void>;
  handleRemoteSessionEnded: () => Promise<void>;
};

export const useGroupStore = create<GroupStore>((set, get) => ({
  active: getIdleGroup(),
  hasActiveSession: false,
  isBootstrapped: false,

  setActive: (group) =>
    set({
      active: group,
      hasActiveSession: isRealSessionId(group.id),
    }),

  setVibeKey: (key) =>
    set((state) => ({
      active: { ...state.active, vibeKey: key },
    })),

  createGroup: async (draft) => {
    const group = await createSession({
      name: draft.name,
      vibeKey: draft.vibeKey,
    });

    await persistActiveSessionId(group.id);
    set({ active: group, hasActiveSession: true });
  },

  joinSession: async (inviteCode) => {
    const group = await joinSessionOnServer(inviteCode);
    await persistActiveSessionId(group.id);
    set({ active: group, hasActiveSession: true });
  },

  applyGroupSnapshot: (group) => {
    const { hasActiveSession, active } = get();
    if (!hasActiveSession || active.id !== group.id) return;
    set({ active: group });
  },

  restoreActiveSession: async () => {
    const sessionId = await readActiveSessionId();

    if (!sessionId) {
      const idle = await hydrateIdleUser(getIdleGroup());
      set({ active: idle, hasActiveSession: false, isBootstrapped: true });
      return;
    }

    const group = await getSession(sessionId);

    if (!group) {
      await clearActiveSessionId();
      const idle = await hydrateIdleUser(getIdleGroup());
      set({ active: idle, hasActiveSession: false, isBootstrapped: true });
      return;
    }

    set({ active: group, hasActiveSession: true, isBootstrapped: true });
  },

  endSession: async () => {
    const { active, hasActiveSession } = get();
    if (!hasActiveSession || !isRealSessionId(active.id)) return;

    await endSessionOnServer(active.id);
    await clearActiveSessionId();

    const idle = await hydrateIdleUser(getIdleGroup());
    set({ active: idle, hasActiveSession: false });
  },

  handleRemoteSessionEnded: async () => {
    const { hasActiveSession } = get();
    if (!hasActiveSession) return;

    await clearActiveSessionId();
    await leaveSessionChannel();

    const idle = await hydrateIdleUser(getIdleGroup());
    set({ active: idle, hasActiveSession: false });
  },
}));

onSessionEnded(() => {
  void useGroupStore.getState().handleRemoteSessionEnded();
});

onRosterChanged((group) => {
  useGroupStore.getState().applyGroupSnapshot(group);
});

/** Selector helper — read just the member list. */
export const selectMembers = (s: GroupStore) => s.active.members;
/** Selector helper — read just the active group's id. */
export const selectActiveGroupId = (s: GroupStore) => s.active.id;
export const selectHasActiveSession = (s: GroupStore) => s.hasActiveSession;
