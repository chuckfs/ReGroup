import type { Friend, FriendStatus, MapPosition } from '@/types';

/**
 * StatusEngine — derives a `FriendStatus` from a friend's distance to
 * the group centroid, battery, and "last seen" age. Kept pure so it can
 * run on either the device (today, against mock data) or the server
 * (later, as part of the realtime backend).
 *
 * ─── Production swap ────────────────────────────────────────────────
 * TODO(backend): mirror this exact logic on the server (or run it in a
 * realtime worker) so all clients see the same status without
 * recomputing locally. The thresholds below are tuned for a small urban
 * group; they likely become per-vibe / per-group-config later.
 *
 * Thresholds are intentionally generous — a true "Separated" status
 * should be a notable, alarming event, not a passing miscount.
 */

const THRESHOLDS = {
  /** Miles. Anything <= this is "with the group". */
  withGroupMiles: 0.06,
  /** Miles. Up to this you're "nearby" — within walking earshot. */
  nearbyMiles: 0.25,
  /** Miles. Up to this you're "drifting" — somewhere on the same block. */
  driftingMiles: 0.75,
  /** Battery % under which we surface a low-battery alert. */
  lowBatteryPct: 20,
  /** Minutes without a ping after which we degrade to "separated". */
  staleMinutes: 12,
} as const;

export function computeFriendStatus(input: {
  /** Distance from the group centroid, in miles. */
  distanceMiles: number;
  /** Minutes since last ping. */
  minutesSinceLastSeen: number;
  /** Friend's self-declared status (e.g. "heading_home"). Wins when set. */
  declared?: FriendStatus;
}): FriendStatus {
  const { distanceMiles, minutesSinceLastSeen, declared } = input;

  // A user's own declaration ("Heading Home", "Home Safe") always wins.
  if (declared === 'heading_home' || declared === 'home_safe') return declared;

  if (minutesSinceLastSeen >= THRESHOLDS.staleMinutes) return 'separated';

  if (distanceMiles <= THRESHOLDS.withGroupMiles) return 'with_group';
  if (distanceMiles <= THRESHOLDS.nearbyMiles) return 'nearby';
  if (distanceMiles <= THRESHOLDS.driftingMiles) return 'drifting';
  return 'separated';
}

/**
 * Average of all friend positions — used as the "group centroid" so we
 * can compute per-friend distance without picking an arbitrary anchor.
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

export const STATUS_THRESHOLDS = THRESHOLDS;
