import { create } from 'zustand';

import type { Alert } from '@/types';

/**
 * UI / ambient state — anything that isn't domain data (groups, friends)
 * but affects how the app looks and feels right now:
 *
 *   - Bottom sheet snap state (so the FAB and map can react)
 *   - Pending alerts feed
 *   - "Map is being interacted with" mode for ambient dimming (later)
 *
 * Domain data lives in `useGroupStore` / `useFriendStore`. UI state
 * lives here. Mixing them is a smell.
 */

export type SheetSnap = 'peek' | 'mid' | 'full';

type UIStore = {
  /** Where the bottom sheet currently snaps. */
  sheetSnap: SheetSnap;
  setSheetSnap: (snap: SheetSnap) => void;

  /** Alerts feed. Today seeded empty; the status engine will push here. */
  alerts: Alert[];
  pushAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  sheetSnap: 'mid',
  setSheetSnap: (snap) => set({ sheetSnap: snap }),

  alerts: [],
  pushAlert: (alert) =>
    set((s) => ({
      alerts: [alert, ...s.alerts].slice(0, 50),
    })),
  acknowledgeAlert: (alertId) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a,
      ),
    })),
  clearAlerts: () => set({ alerts: [] }),
}));

/** Selector — count of unacknowledged alerts (e.g. for a badge). */
export const selectUnreadAlertCount = (s: UIStore) =>
  s.alerts.filter((a) => !a.acknowledged).length;
