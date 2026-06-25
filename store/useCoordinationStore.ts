import { create } from 'zustand';

import { RESPONSE_TIMEOUT_MS } from '@/lib/coordinationStatus';
import type { CoordinationUpdate, RallyPoint } from '@/types/coordination';
import type { CoordinationStatus } from '@/types/status';

type RallyResponse = Exclude<CoordinationStatus, 'no_response'>;

type CoordinationStore = {
  activeRally: RallyPoint | null;
  responses: Record<string, RallyResponse>;
  responseDeadline: number | null;
  setActiveRally: (rally: RallyPoint) => void;
  clearRally: () => void;
  applyCoordinationUpdate: (update: CoordinationUpdate) => void;
};

export const useCoordinationStore = create<CoordinationStore>((set, get) => ({
  activeRally: null,
  responses: {},
  responseDeadline: null,

  setActiveRally: (rally) =>
    set({
      activeRally: rally,
      responses: {},
      responseDeadline: Date.now() + RESPONSE_TIMEOUT_MS,
    }),

  clearRally: () =>
    set({
      activeRally: null,
      responses: {},
      responseDeadline: null,
    }),

  applyCoordinationUpdate: (update) => {
    const { activeRally } = get();
    if (!activeRally || activeRally.rallyId !== update.rallyId) return;

    set((state) => ({
      responses: {
        ...state.responses,
        [update.userId]: update.status,
      },
    }));
  },
}));

export const selectActiveRally = (s: CoordinationStore) => s.activeRally;
export const selectRallyResponses = (s: CoordinationStore) => s.responses;
export const selectResponseDeadline = (s: CoordinationStore) => s.responseDeadline;
