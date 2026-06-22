import { create } from 'zustand';

import type { Alert } from '@/types';
import type { AwarenessEvent } from '@/types/awareness';

/**
 * UI / ambient state — anything that isn't domain data (groups, friends)
 * but affects how the app looks and feels right now:
 *
 *   - Bottom sheet snap state (so the FAB and map can react)
 *   - Awareness events feed (warm ambient banners)
 *   - Legacy alerts feed (future push / history)
 *
 * Domain data lives in `useGroupStore` / `useFriendStore`. UI state
 * lives here. Mixing them is a smell.
 */

export type SheetSnap = 'peek' | 'mid' | 'full';

type UIStore = {
  /** Where the bottom sheet currently snaps. */
  sheetSnap: SheetSnap;
  setSheetSnap: (snap: SheetSnap) => void;

  /** Awareness events surfaced as soft ambient UI. */
  awarenessEvents: AwarenessEvent[];
  activeAwarenessEvent: AwarenessEvent | null;
  pushAwarenessEvent: (event: AwarenessEvent) => void;
  dismissAwarenessEvent: (eventId: string) => void;
  clearAwarenessEvents: () => void;

  /** Legacy alerts feed — future push / history surface. */
  alerts: Alert[];
  pushAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
};

function selectActiveEvent(
  events: AwarenessEvent[],
): AwarenessEvent | null {
  return events.find((event) => !event.dismissed) ?? null;
}

export const useUIStore = create<UIStore>((set) => ({
  sheetSnap: 'mid',
  setSheetSnap: (snap) => set({ sheetSnap: snap }),

  awarenessEvents: [],
  activeAwarenessEvent: null,

  pushAwarenessEvent: (event) =>
    set((s) => {
      const awarenessEvents = [event, ...s.awarenessEvents].slice(0, 30);
      return {
        awarenessEvents,
        activeAwarenessEvent: selectActiveEvent(awarenessEvents),
      };
    }),

  dismissAwarenessEvent: (eventId) =>
    set((s) => {
      const awarenessEvents = s.awarenessEvents.map((event) =>
        event.id === eventId ? { ...event, dismissed: true } : event,
      );
      return {
        awarenessEvents,
        activeAwarenessEvent: selectActiveEvent(awarenessEvents),
      };
    }),

  clearAwarenessEvents: () =>
    set({ awarenessEvents: [], activeAwarenessEvent: null }),

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
