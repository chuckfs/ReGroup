import { calculateDistanceFeet } from '@/services/distance';
import type { DeviceLocation } from '@/types/location';
import type { ProximityStatus } from '@/types/status';

/**
 * Proximity engine — distance → status bands.
 *
 * ## v1 model: user-relative
 *
 * All proximity is computed from **the user's GPS fix** to each friend's
 * fix. See `docs/proximity-model.md` for the locked decision.
 *
 * Group-centroid distance is deferred to Phase 4 — do not wire
 * `computeGroupCentroid` into this path until then.
 *
 * TODO(Phase 4): optional centroid anchor + adaptive venue thresholds.
 * TODO(realtime): Supabase friend positions replace dev simulator input.
 */
export const PROXIMITY_ANCHOR = 'user' as const;

export type ProximityAnchor = typeof PROXIMITY_ANCHOR | 'centroid';

export const PROXIMITY_THRESHOLDS_FEET = {
  WITH_GROUP: 150,
  NEARBY: 500,
  DRIFTING: 1_000,
} as const;

export type ProximityResult = {
  /** Straight-line feet from the proximity anchor (user in v1). */
  distanceFeet: number;
  status: ProximityStatus;
};

/**
 * Map a straight-line distance (feet) to a proximity band.
 */
export function computeProximityStatus(distanceFeet: number): ProximityStatus {
  if (distanceFeet < PROXIMITY_THRESHOLDS_FEET.WITH_GROUP) return 'with_group';
  if (distanceFeet < PROXIMITY_THRESHOLDS_FEET.NEARBY) return 'nearby';
  if (distanceFeet < PROXIMITY_THRESHOLDS_FEET.DRIFTING) return 'drifting';
  return 'separated';
}

/**
 * Derive a friend's proximity band from the user's fix and the friend's
 * fix. v1 always anchors on the user — not the group centroid.
 */
export function computeFriendProximity(
  userLocation: DeviceLocation,
  friendLocation: DeviceLocation,
): ProximityResult {
  const distanceFeet = calculateDistanceFeet(userLocation, friendLocation);
  return {
    distanceFeet,
    status: computeProximityStatus(distanceFeet),
  };
}

/**
 * Batch-compute proximity for every friend against the user (v1 anchor).
 */
export function computeAllFriendProximity(
  userLocation: DeviceLocation,
  friendLocations: Record<string, DeviceLocation>,
): Record<string, ProximityResult> {
  const results: Record<string, ProximityResult> = {};

  for (const [friendId, friendLocation] of Object.entries(friendLocations)) {
    results[friendId] = computeFriendProximity(userLocation, friendLocation);
  }

  return results;
}
