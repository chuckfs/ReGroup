import { create } from 'zustand';

import type { RallyPoint } from '@/types/coordination';

type CoordinationStore = {
  activeRally: RallyPoint | null;
  setActiveRally: (rally: RallyPoint) => void;
  clearRally: () => void;
};

export const useCoordinationStore = create<CoordinationStore>((set) => ({
  activeRally: null,

  setActiveRally: (rally) => set({ activeRally: rally }),

  clearRally: () => set({ activeRally: null }),
}));

export const selectActiveRally = (s: CoordinationStore) => s.activeRally;
