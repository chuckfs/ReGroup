import { bearingDegrees, moveByMeters, offsetByFeet } from '@/services/geo';
import type { DeviceLocation, GeoCoordinate } from '@/types/location';
import type { Friend } from '@/types';

const TICK_MS = 1_000;
const FEET_PER_METER = 3.28084;

type SimBehavior = 'regroup' | 'drift_away' | 'pause' | 'wander';

type SimFriendState = {
  coordinate: GeoCoordinate;
  bearing: number;
  behavior: SimBehavior;
  behaviorTicksRemaining: number;
  speedMps: number;
};

type SimUpdate = {
  friendId: string;
  location: DeviceLocation;
};

type Listener = (update: SimUpdate) => void;

/** Starting offsets so friends begin at varied distances from the user. */
const INITIAL_OFFSETS: Record<
  string,
  { bearing: number; distanceFeet: number; behavior: SimBehavior }
> = {
  f_jake: { bearing: 15, distanceFeet: 90, behavior: 'wander' },
  f_maya: { bearing: 110, distanceFeet: 130, behavior: 'regroup' },
  f_chris: { bearing: 210, distanceFeet: 720, behavior: 'drift_away' },
  f_sophie: { bearing: 280, distanceFeet: 110, behavior: 'wander' },
  f_ben: { bearing: 45, distanceFeet: 380, behavior: 'wander' },
  f_alex: { bearing: 160, distanceFeet: 950, behavior: 'drift_away' },
};

function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickBehavior(current: SimBehavior): SimBehavior {
  const pool: SimBehavior[] = ['regroup', 'drift_away', 'pause', 'wander'];
  const filtered = pool.filter((b) => b !== current);
  return filtered[randomInt(0, filtered.length - 1)];
}

function toDeviceLocation(coordinate: GeoCoordinate): DeviceLocation {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    timestamp: Date.now(),
  };
}

/**
 * Dev-only friend GPS simulator. Walks friends slowly around the user's
 * real location — regrouping, drifting, pausing, and wandering without
 * teleporting.
 *
 * TODO(realtime): delete this module when Supabase realtime friend
 * positions replace the simulated source.
 */
class FriendSimulatorImpl {
  private states = new Map<string, SimFriendState>();
  private userLocation: GeoCoordinate | null = null;
  private listeners = new Set<Listener>();
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private pausedFriends = new Map<string, number>();

  seed(friends: Friend[], userLocation: DeviceLocation): void {
    this.userLocation = userLocation;
    this.states.clear();

    for (const friend of friends) {
      const preset = INITIAL_OFFSETS[friend.id] ?? {
        bearing: hash01(friend.id) * 360,
        distanceFeet: 200 + hash01(`${friend.id}-d`) * 400,
        behavior: 'wander' as SimBehavior,
      };

      const coordinate = offsetByFeet(
        userLocation,
        preset.bearing,
        preset.distanceFeet,
      );

      this.states.set(friend.id, {
        coordinate,
        bearing: preset.bearing,
        behavior: preset.behavior,
        behaviorTicksRemaining: randomInt(8, 18),
        speedMps: 0.7 + hash01(`${friend.id}-s`) * 0.6,
      });

      this.emit(friend.id, coordinate);
    }
  }

  setUserLocation(userLocation: DeviceLocation): void {
    this.userLocation = userLocation;
  }

  start(): void {
    if (!__DEV__ || this.intervalHandle) return;
    this.intervalHandle = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): Record<string, DeviceLocation> {
    const out: Record<string, DeviceLocation> = {};
    for (const [id, state] of this.states) {
      const pausedAt = this.pausedFriends.get(id);
      out[id] = {
        latitude: state.coordinate.latitude,
        longitude: state.coordinate.longitude,
        timestamp: pausedAt ?? Date.now(),
      };
    }
    return out;
  }

  /** Dev helper — script a friend to drift, regroup, pause, or wander. */
  setBehavior(friendId: string, behavior: SimBehavior): void {
    if (!__DEV__) return;
    const state = this.states.get(friendId);
    if (!state) return;
    state.behavior = behavior;
    state.behaviorTicksRemaining = randomInt(10, 20);
    this.resumeUpdates(friendId);
  }

  /** Dev helper — pull every simulated friend back toward the user. */
  regroupAll(): void {
    if (!__DEV__) return;
    for (const state of this.states.values()) {
      state.behavior = 'regroup';
      state.behaviorTicksRemaining = randomInt(12, 24);
    }
    this.pausedFriends.clear();
  }

  /** Dev helper — freeze location updates to trigger stale awareness. */
  pauseUpdates(friendId: string): void {
    if (!__DEV__) return;
    const state = this.states.get(friendId);
    if (!state) return;
    state.behavior = 'pause';
    this.pausedFriends.set(friendId, Date.now());
  }

  resumeUpdates(friendId: string): void {
    this.pausedFriends.delete(friendId);
  }

  resumeAllUpdates(): void {
    this.pausedFriends.clear();
  }

  private tick(): void {
    if (!this.userLocation) return;

    for (const [friendId, state] of this.states) {
      if (this.pausedFriends.has(friendId)) {
        this.emitPaused(friendId, state.coordinate);
        continue;
      }

      if (state.behaviorTicksRemaining <= 0) {
        state.behavior = pickBehavior(state.behavior);
        state.behaviorTicksRemaining = randomInt(6, 16);
      }
      state.behaviorTicksRemaining -= 1;

      this.applyBehavior(state);

      const stepMeters = this.stepMeters(state);
      if (stepMeters > 0) {
        state.coordinate = moveByMeters(
          state.coordinate,
          state.bearing,
          stepMeters,
        );
      }

      this.emit(friendId, state.coordinate);
    }
  }

  private applyBehavior(state: SimFriendState): void {
    if (!this.userLocation) return;

    switch (state.behavior) {
      case 'regroup':
        state.bearing = bearingDegrees(state.coordinate, this.userLocation);
        break;
      case 'drift_away':
        state.bearing = bearingDegrees(this.userLocation, state.coordinate);
        break;
      case 'wander':
        if (Math.random() < 0.25) {
          state.bearing = (state.bearing + randomInt(-25, 25) + 360) % 360;
        }
        break;
      case 'pause':
        break;
    }
  }

  private stepMeters(state: SimFriendState): number {
    if (state.behavior === 'pause') return 0;

    const speedFactor =
      state.behavior === 'regroup'
        ? 1.1
        : state.behavior === 'drift_away'
          ? 0.85
          : 0.65;

    return state.speedMps * speedFactor * (TICK_MS / 1000);
  }

  private emit(friendId: string, coordinate: GeoCoordinate): void {
    const location = toDeviceLocation(coordinate);
    for (const listener of this.listeners) {
      listener({ friendId, location });
    }
  }

  private emitPaused(friendId: string, coordinate: GeoCoordinate): void {
    const pausedAt = this.pausedFriends.get(friendId) ?? Date.now();
    const location: DeviceLocation = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      timestamp: pausedAt,
    };
    for (const listener of this.listeners) {
      listener({ friendId, location });
    }
  }
}

export const friendSimulator = new FriendSimulatorImpl();

/** Pretty-print feet for the dev proximity panel. */
export function formatDistanceFeet(feet: number): string {
  return `${Math.round(feet)} ft`;
}

export { FEET_PER_METER };
