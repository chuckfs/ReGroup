import type { MarkerHue } from '@/constants';
import type { MapPosition } from './location';
import type {
  CoordinationStatus,
  DeclaredStatus,
  DisplayStatus,
  ProximityStatus,
} from './status';

/**
 * Friend-related types. Kept separate from group types for a tight import
 * surface (`types/friend.ts` + `types/status.ts`).
 *
 * When the backend lands, these are the shapes the realtime layer
 * must produce per friend update. See `docs/backend-contract.md`.
 */

export type StatusTone = 'positive' | 'neutral' | 'warning' | 'danger';

export type Friend = {
  id: string;
  name: string;
  initials: string;
  hue: MarkerHue;
  /** Merged status for UI — see mergeDisplayStatus in types/status.ts */
  status: DisplayStatus;
  /** Computed from distance; set by useLiveFriends when GPS is live. */
  proximityStatus?: ProximityStatus;
  /** User-declared via quick action or backend sync. */
  declaredStatus?: DeclaredStatus;
  /** Response to a regroup rally (Phase 5). */
  coordinationStatus?: CoordinationStatus;
  batteryPercent: number;
  /** Minutes since last seen by the group. */
  lastSeenMinutesAgo: number;
  position: MapPosition;
  /** Human-readable place (e.g. "Wythe Ave, Brooklyn"). */
  lastSeenPlace?: string;
  /** Straight-line distance from the user, in miles (v1 anchor). Phase 4 may add centroid distance. */
  distanceFromUserMiles?: number;
  /** What device they're on — used in the detail sheet. */
  device?: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  initials: string;
  batteryPercent: number;
  status: DisplayStatus;
  declaredStatus?: DeclaredStatus;
  /**
   * The user's own position in normalised map space (0..1). Driven by
   * the GPS pipeline via `useUserMapPosition`; when absent the map
   * treats them as anchored at (0.5, 0.5).
   *
   * The map renders the user *visually* at screen centre regardless and
   * uses this value as the "camera origin" — friends are drawn relative
   * to it so the user stays centred as they drift.
   */
  position?: MapPosition;
};
