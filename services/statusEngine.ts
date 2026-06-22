import type { Friend, MapPosition } from '@/types';

import { PROXIMITY_THRESHOLDS_FEET } from './proximityEngine';

/**
 * Session-level helpers — battery thresholds and centroid math.
 *
 * Proximity bands: `proximityEngine` (user-relative in v1).
 * Awareness transitions: `awarenessEngine`.
 *
 * See `docs/proximity-model.md` for the v1 proximity decision.
 *
 * TODO(backend): mirror threshold logic on the server.
 */
const THRESHOLDS = {
  /** Battery % under which we surface a low-battery awareness event. */
  lowBatteryPct: 20,
  /** Minutes without a ping after which we degrade to "separated". */
  staleMinutes: 12,
} as const;

/**
 * Average of friend map positions — the group centroid in normalised
 * map space.
 *
 * **Phase 4 only.** Not called from any live path in v1. When wired,
 * this will support map auto-fit, group-cohesion summaries, and
 * optional centroid-relative proximity. See `docs/proximity-model.md`.
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
