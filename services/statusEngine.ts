import type { Friend, MapPosition } from '@/types';

import { PROXIMITY_THRESHOLDS_FEET } from './proximityEngine';

/**
 * Group-level helpers — battery thresholds and centroid math.
 * Proximity bands live in `proximityEngine`; awareness transitions
 * live in `awarenessEngine`.
 *
 * ─── Production swap ────────────────────────────────────────────────
 * TODO(backend): mirror threshold logic on the server so all clients
 * see the same status without recomputing locally.
 *
 * TODO(centroid): wire `computeGroupCentroid` into the live path in
 * Phase 4 when map auto-fit and group-relative distance land. v1 uses
 * user-relative proximity only (`proximityEngine`).
 */
const THRESHOLDS = {
  /** Battery % under which we surface a low-battery awareness event. */
  lowBatteryPct: 20,
  /** Minutes without a ping after which we degrade to "separated". */
  staleMinutes: 12,
} as const;

/**
 * Average of all friend positions — used as the "group centroid" so we
 * can compute per-friend distance without picking an arbitrary anchor.
 *
 * Phase 4 — not wired in v1.
 */
export function computeGroupCentroid(friends: Friend[]): MapPosition {
  if (friends.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  for (const f of friends) {
    sx += f.position.x;
    sy += f.position.y;
  }
  return { x: sx / friends.length, y: sy / friends.length };
}

/** Quick boolean — should we surface a low-battery awareness event? */
export function isLowBattery(friend: Friend): boolean {
  return friend.batteryPercent <= THRESHOLDS.lowBatteryPct;
}

export const STATUS_THRESHOLDS = {
  ...THRESHOLDS,
  proximityFeet: PROXIMITY_THRESHOLDS_FEET,
};
