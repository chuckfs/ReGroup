import { useCallback, useEffect } from 'react';

import { useUIStore, type SheetSnap } from '@/store/useUIStore';

/**
 * Tiny convenience hook around the `useUIStore` sheet-snap state.
 *
 * Components rendering bottom sheets read/set the snap via `setSnap()`
 * here so the rest of the UI (FAB visibility, map dim, etc.) can react
 * without prop-drilling.
 *
 * `initialSnap` will only be applied once per mount.
 */
export function useBottomSheet(initialSnap: SheetSnap = 'mid') {
  const snap = useUIStore((s) => s.sheetSnap);
  const setSnap = useUIStore((s) => s.setSheetSnap);

  useEffect(() => {
    setSnap(initialSnap);
    // Initial snap is intentionally only applied on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFull = snap === 'full';
  const isPeek = snap === 'peek';

  const cycle = useCallback(() => {
    setSnap(snap === 'peek' ? 'mid' : snap === 'mid' ? 'full' : 'peek');
  }, [setSnap, snap]);

  return { snap, setSnap, isFull, isPeek, cycle };
}
