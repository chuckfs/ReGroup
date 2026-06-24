import type { AwarenessEvent, AwarenessEventType } from '@/types/awareness';
import type { Friend } from '@/types';
import type { DeviceLocation } from '@/types/location';
import {
  effectiveProximity,
  isProximityStatus,
  type ProximityStatus,
} from '@/types/status';

import { STATUS_THRESHOLDS } from './statusEngine';

/**
 * Awareness thresholds — tuned for helpful nudges, not alarm fatigue.
 *
 * TODO(venue): adapt stale windows and battery urgency by venue type.
 */
export const AWARENESS_THRESHOLDS = {
  criticalBatteryPct: STATUS_THRESHOLDS.lowBatteryPct,
  /** No fresh location fix within this window → stale. */
  staleLocationMs: __DEV__ ? 15_000 : STATUS_THRESHOLDS.staleMinutes * 60_000,
} as const;

type FriendSnapshot = {
  friendId: string;
  friendName: string;
  proximityStatus: ProximityStatus;
  batteryPercent: number;
  locationTimestamp: number | null;
  now: number;
};

type FriendAwarenessState = {
  proximity: ProximityStatus;
  batteryLow: boolean;
  locationStale: boolean;
};

type TransitionKey =
  | 'nearby->drifting'
  | 'drifting->separated'
  | 'separated->nearby'
  | 'separated->with_group';

const PROXIMITY_TRANSITIONS: Record<TransitionKey, AwarenessEventType> = {
  'nearby->drifting': 'proximity_drifting',
  'drifting->separated': 'proximity_separated',
  'separated->nearby': 'proximity_reconnected',
  'separated->with_group': 'proximity_reconnected',
};

function transitionKey(
  from: ProximityStatus,
  to: ProximityStatus,
): TransitionKey | null {
  const key = `${from}->${to}` as TransitionKey;
  return key in PROXIMITY_TRANSITIONS ? key : null;
}

function buildMessage(
  type: AwarenessEventType,
  friendName: string,
): string {
  switch (type) {
    case 'proximity_drifting':
      return `${friendName} is starting to drift — still close by`;
    case 'proximity_separated':
      return `${friendName} has wandered a bit far from the crew`;
    case 'proximity_reconnected':
      return `${friendName} is heading back toward the group`;
    case 'battery_low':
      return `${friendName}'s phone is running low — might lose touch soon`;
    case 'location_stale':
      return `Haven't heard from ${friendName} in a while`;
  }
}

function createEvent(
  friendId: string,
  type: AwarenessEventType,
  message: string,
  now: number,
): AwarenessEvent {
  return {
    id: `aware_${friendId}_${type}_${now}`,
    friendId,
    type,
    message,
    timestamp: now,
  };
}

function snapshotState(input: FriendSnapshot): FriendAwarenessState {
  const locationStale =
    input.locationTimestamp == null ||
    input.now - input.locationTimestamp >= AWARENESS_THRESHOLDS.staleLocationMs;

  return {
    proximity: input.proximityStatus,
    batteryLow: input.batteryPercent <= AWARENESS_THRESHOLDS.criticalBatteryPct,
    locationStale,
  };
}

/**
 * Pure transition detector — emits awareness events only when a friend's
 * proximity, battery, or freshness state changes.
 *
 * Tracks proximity bands only — declared/coordination statuses do not
 * suppress proximity transition detection.
 *
 * Proximity, battery, and stale transitions from realtime friend fixes.
 */
export class AwarenessEngineTracker {
  private previous = new Map<string, FriendAwarenessState>();

  /**
   * Compare the current crew snapshot against prior state and return any
   * newly triggered awareness events.
   */
  evaluate(
    friends: Friend[],
    friendLocations: Record<string, DeviceLocation>,
    now = Date.now(),
  ): AwarenessEvent[] {
    const events: AwarenessEvent[] = [];

    for (const friend of friends) {
      const location = friendLocations[friend.id];
      const snapshot: FriendSnapshot = {
        friendId: friend.id,
        friendName: friend.name,
        proximityStatus: effectiveProximity(friend),
        batteryPercent: friend.batteryPercent,
        locationTimestamp: location?.timestamp ?? null,
        now,
      };

      const current = snapshotState(snapshot);
      const prior = this.previous.get(friend.id);

      if (!prior) {
        this.previous.set(friend.id, current);
        continue;
      }

      if (prior.proximity !== current.proximity) {
        const key = transitionKey(prior.proximity, current.proximity);
        if (key) {
          const type = PROXIMITY_TRANSITIONS[key];
          events.push(
            createEvent(
              friend.id,
              type,
              buildMessage(type, friend.name),
              now,
            ),
          );
        }
      }

      if (!prior.batteryLow && current.batteryLow) {
        events.push(
          createEvent(
            friend.id,
            'battery_low',
            buildMessage('battery_low', friend.name),
            now,
          ),
        );
      }

      if (!prior.locationStale && current.locationStale) {
        events.push(
          createEvent(
            friend.id,
            'location_stale',
            buildMessage('location_stale', friend.name),
            now,
          ),
        );
      }

      this.previous.set(friend.id, current);
    }

    return events;
  }

  reset(): void {
    this.previous.clear();
  }
}

export const awarenessEngine = new AwarenessEngineTracker();

/**
 * Convenience wrapper used by the awareness loop hook.
 */
export function detectAwarenessEvents(
  friends: Friend[],
  friendLocations: Record<string, DeviceLocation>,
  now?: number,
): AwarenessEvent[] {
  return awarenessEngine.evaluate(friends, friendLocations, now);
}
