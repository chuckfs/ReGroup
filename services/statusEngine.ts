import type { Friend, FriendStatus, MapPosition } from '@/types';

import {
  computeProximityStatus,
  PROXIMITY_THRESHOLDS_FEET,
  resolveFriendStatus,
} from './proximityEngine';

const FEET_PER_MILE = 5_280;

/**
 * StatusEngine — derives a `FriendStatus` from distance, battery, and
 * "last seen" age. Proximity bands are delegated to `proximityEngine`.
 *
 * ─── Production swap ────────────────────────────────────────────────
 * TODO(backend): mirror this exact logic on the server (or run it in a
 * realtime worker) so all clients see the same status without
 * recomputing locally.
 *
 * TODO(centroid): derive centroid from live Supabase realtime GPS fixes
 * instead of mock normalised map positions.
 *
 * TODO(drifting): run proximity checks on each realtime location tick to
 * detect drifting and separated states without polling.
 */
const THRESHOLDS = {
  /** Battery % under which we surface a low-battery alert. */
  lowBatteryPct: 20,
  /** Minutes without a ping after which we degrade to "separated". */
  staleMinutes: 12,
} as const;

/** @deprecated Prefer `computeProximityStatus` with feet from `distance.ts`. */
export function computeFriendStatus(input: {
  /** Distance from the group centroid, in miles. */
  distanceMiles: number;
  /** Minutes since last ping. */
  minutesSinceLastSeen: number;
  /** Friend's self-declared status (e.g. "heading_home"). Wins when set. */
  declared?: FriendStatus;
}): FriendStatus {
  const { distanceMiles, minutesSinceLastSeen, declared } = input;

  if (declared === 'heading_home' || declared === 'home_safe') return declared;
  if (minutesSinceLastSeen >= THRESHOLDS.staleMinutes) return 'separated';

  const distanceFeet = distanceMiles * FEET_PER_MILE;
  return resolveFriendStatus(computeProximityStatus(distanceFeet), declared);
}

/**
 * Average of all friend positions — used as the "group centroid" so we
 * can compute per-friend distance without picking an arbitrary anchor.
 *
 * TODO(centroid): derive centroid from live Supabase realtime GPS fixes
 * instead of mock normalised map positions.
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

/** Quick boolean — should we surface a low-battery alert for this friend? */
export function isLowBattery(friend: Friend): boolean {
  return friend.batteryPercent <= THRESHOLDS.lowBatteryPct;
}

export const STATUS_THRESHOLDS = {
  ...THRESHOLDS,
  proximityFeet: PROXIMITY_THRESHOLDS_FEET,
};
