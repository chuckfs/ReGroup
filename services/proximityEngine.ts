import { calculateDistanceFeet } from '@/services/distance';
import type { DeviceLocation } from '@/types/location';
import type { FriendStatus } from '@/types';

/**
 * Proximity bands — single source of truth for status thresholds.
 * Distances are straight-line feet from the user (today) or group
 * centroid (later).
 *
 * TODO(centroid): compute distance from the live group centroid once
 * Supabase realtime friend positions are wired.
 *
 * TODO(venue): make thresholds adaptive by venue type (festival vs
 * bar crawl vs house party).
 */
export const PROXIMITY_THRESHOLDS_FEET = {
  WITH_GROUP: 150,
  NEARBY: 500,
  DRIFTING: 1_000,
} as const;

export type ProximityBand = 'with_group' | 'nearby' | 'drifting' | 'separated';

export type ProximityResult = {
  distanceFeet: number;
  status: ProximityBand;
};

/**
 * Map a straight-line distance (feet) to a proximity band.
 */
export function computeProximityStatus(distanceFeet: number): ProximityBand {
  if (distanceFeet < PROXIMITY_THRESHOLDS_FEET.WITH_GROUP) return 'with_group';
  if (distanceFeet < PROXIMITY_THRESHOLDS_FEET.NEARBY) return 'nearby';
  if (distanceFeet < PROXIMITY_THRESHOLDS_FEET.DRIFTING) return 'drifting';
  return 'separated';
}

/**
 * Derive a friend's proximity band from user + friend GPS fixes.
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
 * Batch-compute proximity for every friend against the user.
 *
 * TODO(realtime): replace simulated `friendLocations` with Supabase
 * realtime GPS fixes keyed by friend id.
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

/**
 * Self-declared statuses (e.g. "Heading Home") override proximity bands.
 */
export function resolveFriendStatus(
  proximity: ProximityBand,
  declared?: FriendStatus,
): FriendStatus {
  if (declared === 'heading_home' || declared === 'home_safe') return declared;
  return proximity;
}
