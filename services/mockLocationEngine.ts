import type { Friend, FriendStatus, MapPosition } from '@/types';

/**
 * MockLocationEngine — capable of synthesising gentle, deterministic
 * drift over the existing `mockGroup` positions so the stylised map can
 * feel alive even without a backend.
 *
 * The engine is **inert by default** — it only emits when `start()` is
 * called explicitly. The shipping app prefers static pins (pins move
 * only when their location actually updates), but a demo/screenshot
 * mode can opt into the drift loop.
 *
 * ─── Production swap ────────────────────────────────────────────────
 * TODO(backend): replace this engine with `services/locationService.ts`
 * that subscribes to a realtime channel (Supabase Realtime, Pusher, or
 * a WebSocket gateway) and emits the same { friendId, position } shape.
 * `useMockLocation` consumes the engine, so component code never
 * depends on this implementation directly.
 *
 * Engine API:
 *   - `start()`     — begin emitting drift updates (idempotent, opt-in)
 *   - `stop()`      — pause the loop
 *   - `subscribe()` — register a listener, returns an unsubscribe fn
 *   - `seed()`      — register a movable's anchor position (call once
 *                     per movable at app boot). Accepts either a Friend
 *                     or the lighter `Movable` shape so non-friend
 *                     entities (e.g. the user) can also be tracked.
 */

export type LocationUpdate = {
  /** Stable id of the moving entity (friend id or user id). */
  friendId: string;
  position: MapPosition;
  /** Engine tick time (ms since start) — useful for animation phase. */
  t: number;
};

/**
 * Minimal shape the engine needs to seed a moving thing. Both `Friend`
 * and `CurrentUser` satisfy this when you give the user an id, position,
 * and (optionally) a status to derive the drift radius.
 */
export type Movable = {
  id: string;
  position: MapPosition;
  status?: FriendStatus;
  /** Override the status-derived drift radius. */
  driftRadius?: number;
};

type Listener = (update: LocationUpdate) => void;

type Anchor = {
  friendId: string;
  base: MapPosition;
  /**
   * Drift radius (normalised 0..1 in map space). Tighter for "with_group"
   * friends, wider for "drifting"/"separated". The user typically gets
   * the smallest radius so the auto-centre camera doesn't lurch.
   */
  radius: number;
  /** Per-anchor phase so neighbours don't bob in unison. */
  phase: number;
};

const DRIFT_TICK_MS = 1000;

function radiusForStatus(status: FriendStatus | undefined): number {
  if (status === 'separated' || status === 'drifting') return 0.05;
  if (status === 'nearby') return 0.03;
  return 0.015;
}

class MockLocationEngineImpl {
  private listeners = new Set<Listener>();
  private anchors = new Map<string, Anchor>();
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;

  seed(input: Movable | Friend) {
    const driftOverride =
      'driftRadius' in input ? input.driftRadius : undefined;
    const radius = driftOverride ?? radiusForStatus(input.status);
    this.anchors.set(input.id, {
      friendId: input.id,
      base: input.position,
      radius,
      phase: hash01(input.id) * Math.PI * 2,
    });
  }

  seedAll(inputs: (Movable | Friend)[]) {
    inputs.forEach((m) => this.seed(m));
  }

  start() {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => this.tick(), DRIFT_TICK_MS);
  }

  stop() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private tick() {
    this.tickCount += 1;
    const t = this.tickCount * DRIFT_TICK_MS;

    for (const anchor of this.anchors.values()) {
      // Two superimposed sine waves so the motion never looks robotic.
      const slow = Math.sin(t / 6200 + anchor.phase);
      const fast = Math.sin(t / 2100 + anchor.phase * 1.6);
      const dx = (slow * 0.7 + fast * 0.3) * anchor.radius;
      const dy = (Math.cos(t / 5400 + anchor.phase) * 0.7 +
        Math.sin(t / 1900 + anchor.phase * 1.3) * 0.3) *
        anchor.radius;

      const update: LocationUpdate = {
        friendId: anchor.friendId,
        position: {
          x: clamp01(anchor.base.x + dx),
          y: clamp01(anchor.base.y + dy),
        },
        t,
      };

      this.listeners.forEach((l) => l(update));
    }
  }
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/** Deterministic [0,1] hash of a string id — used to phase per-friend bob. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Module-level singleton. The whole app shares one engine instance so we
 * can seed it once at app boot and subscribe from anywhere.
 */
export const mockLocationEngine = new MockLocationEngineImpl();
