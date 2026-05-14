import type { FriendStatus } from './friend';

/**
 * Alerts are the system-side "something has shifted in the group" events
 * — a friend drifted past the soft-separation threshold, someone's
 * battery dropped under 20%, the group has been split for >10min, etc.
 *
 * Today these are surfaced from local logic in `services/statusEngine`.
 * When realtime lands, alerts will be produced server-side and arrive
 * over the same channel as friend updates.
 */

export type AlertSeverity = 'info' | 'warning' | 'urgent';

export type AlertKind =
  | 'friend_drifting'
  | 'friend_separated'
  | 'friend_low_battery'
  | 'friend_home_safe'
  | 'group_split'
  | 'group_reunited';

export type Alert = {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  /** Headline shown in the alerts feed and any push notification. */
  title: string;
  /** Short supporting copy. */
  body?: string;
  /** ISO timestamp when this alert was emitted. */
  createdAt: string;
  /** The friend this alert references, when applicable. */
  friendId?: string;
  /** Snapshot of the friend's status when the alert fired. */
  friendStatusAtAlert?: FriendStatus;
  /** Has the user acknowledged this alert? */
  acknowledged: boolean;
};

export type AlertFilter = 'all' | 'unread' | AlertSeverity;
