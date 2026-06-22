/**
 * Awareness events — warm, transitional signals that help the crew
 * stay together without feeling like surveillance.
 */

export type AwarenessEventType =
  | 'proximity_drifting'
  | 'proximity_separated'
  | 'proximity_reconnected'
  | 'battery_low'
  | 'location_stale';

export type AwarenessEvent = {
  id: string;
  friendId: string;
  type: AwarenessEventType;
  message: string;
  timestamp: number;
  dismissed?: boolean;
};
