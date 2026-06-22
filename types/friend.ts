import type { MarkerHue } from '@/constants';
import type { MapPosition } from './location';

/**
 * Friend-related types. Kept separate from group/alert types so the
 * friend feature module can import a tight, self-contained surface.
 *
 * When the backend lands, these are the shapes the realtime layer
 * (Supabase / WebSocket) must produce per friend update.
 */

/** Where the friend is relative to the group. Drives marker colour + copy. */
export type FriendStatus =
  | 'with_group'
  | 'nearby'
  | 'drifting'
  | 'separated'
  | 'heading_home'
  | 'home_safe';

export type StatusTone = 'positive' | 'neutral' | 'warning' | 'danger';

export type Friend = {
  id: string;
  name: string;
  initials: string;
  hue: MarkerHue;
  status: FriendStatus;
  batteryPercent: number;
  /** Minutes since last seen by the group. */
  lastSeenMinutesAgo: number;
  position: MapPosition;
  /** Human-readable place (e.g. "Wythe Ave, Brooklyn"). */
  lastSeenPlace?: string;
  /** Straight-line distance from the group's centroid, in miles. */
  distanceFromGroupMiles?: number;
  /** What device they're on — used in the detail sheet. */
  device?: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  initials: string;
  batteryPercent: number;
  status: FriendStatus;
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
