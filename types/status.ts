import type { QuickAction } from './group';

/**
 * Status vocabulary — three layers merged for display.
 *
 * Precedence (highest wins):
 *   coordinationStatus → declaredStatus → proximityStatus
 *
 * Proximity is always computed from distance (user-relative in v1).
 * See `docs/proximity-model.md`. Declared comes from quick actions.
 * Coordination comes from regroup responses (Phase 5).
 */

/** Computed from distance — drives map pins and awareness transitions. */
export type ProximityStatus =
  | 'with_group'
  | 'nearby'
  | 'drifting'
  | 'separated';

/** User-declared via quick actions on the bottom sheet. */
export type DeclaredStatus = 'im_good' | 'heading_home' | 'home_safe';

/** Response to a ReGroup rally point (Phase 5). */
export type CoordinationStatus =
  | 'at_meeting_point'
  | 'heading_to_point'
  | 'cant_make_it'
  | 'no_response';

/** What the UI displays after merging the layers above. */
export type DisplayStatus =
  | ProximityStatus
  | DeclaredStatus
  | CoordinationStatus;

export const PROXIMITY_STATUSES = new Set<ProximityStatus>([
  'with_group',
  'nearby',
  'drifting',
  'separated',
]);

export function isProximityStatus(
  status: DisplayStatus,
): status is ProximityStatus {
  return PROXIMITY_STATUSES.has(status as ProximityStatus);
}

/**
 * Merge computed and declared states into what the UI shows.
 *
 * Precedence: coordination > declared > proximity
 */
export function mergeDisplayStatus(
  proximity: ProximityStatus,
  declared?: DeclaredStatus,
  coordination?: CoordinationStatus,
): DisplayStatus {
  if (coordination) return coordination;
  if (declared) return declared;
  return proximity;
}

/** Map a bottom-sheet quick action to a declared status (if any). */
export function quickActionToDeclaredStatus(
  action: QuickAction,
): DeclaredStatus | null {
  switch (action) {
    case 'im_good':
      return 'im_good';
    case 'heading_home':
      return 'heading_home';
    case 'end_night':
      return 'home_safe';
    default:
      return null;
  }
}

/** Resolve the proximity band used for summaries and awareness. */
export function effectiveProximity(friend: {
  status: DisplayStatus;
  proximityStatus?: ProximityStatus;
}): ProximityStatus {
  if (friend.proximityStatus) return friend.proximityStatus;
  if (isProximityStatus(friend.status)) return friend.status;
  return 'nearby';
}
