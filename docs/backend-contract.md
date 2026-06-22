# ReGroup Backend Contract (v1)

*Phase 0 spec. The TypeScript types in `types/` are the source of truth; this document is the backend implementer's guide.*

Related: `docs/proximity-model.md`, `docs/backend-decision.md`, `AGENTS.md`, `ReGroup-Roadmap.md`

---

## Principles

1. **Ephemeral by design** — sessions end; location data does not survive them.
2. **Latest-fix only** — no location history tables, no route replay.
3. **Session-scoped** — all live data is keyed by `sessionId`.
4. **Client computes proximity** — the backend broadcasts raw `DeviceLocation` fixes; status bands are derived on-device (`proximityEngine`).
5. **Shapes match the client** — the backend produces exactly what the hooks and stores already expect.

---

## Terminology

| Term | Client type | Notes |
|------|-------------|-------|
| Session | `Group` | A temporary "night out" — not a permanent group |
| Member | `Friend` / `CurrentUser` | A user inside an active session |
| Host | membership role | Creates the session, can end it |

---

## Persistent entities

### User

Lightweight identity. Anonymous + display name may suffice for v1.

```typescript
// Proposed — not yet a client type
interface User {
  id: string;              // server-assigned, stable across devices
  displayName: string;
  initials: string;          // 2–3 chars for avatar fallback
  createdAt: string;         // ISO 8601
}
```

**Client swap:** auth layer provides `userId` to stores and realtime channels.

---

### Session

Maps to `Group` in `types/group.ts`.

```typescript
interface Session {
  id: string;                // server-assigned — client never generates session ids
  name: string;
  vibeKey?: GroupVibeKey;    // see types/group.ts
  inviteCode: string;        // e.g. "BKLY-7G3X" — server-generated, unique while active
  hostUserId: string;
  createdAt: string;         // ISO 8601
  endedAt?: string | null;   // set when session ends — triggers teardown
}
```

**`Group` client shape** (what `useGroupStore.active` holds):

```typescript
interface Group {
  id: string;
  name: string;
  vibe: string;              // display label, e.g. "7 people"
  vibeKey?: GroupVibeKey;
  inviteCode?: string;
  members: Friend[];
  user: CurrentUser;
}
```

The client merges `Session` metadata + live `members[]` + local `user` into this shape.

---

### Membership

```typescript
interface Membership {
  sessionId: string;
  userId: string;
  role: 'host' | 'member';
  joinedAt: string;          // ISO 8601
  leftAt?: string | null;      // set on leave or session end
}
```

**Join flow:** validate `inviteCode` → create membership → return canonical `Group` roster.

Deep link (already shared by client): `regroup://join/{inviteCode}`

---

### Invite code rules

- Server-generated on `createSession` (replace client-side draft codes).
- Unique among **active** sessions.
- Invalid after `endedAt` is set.
- Format: human-readable, e.g. `BKLY-7G3X` (matches `InviteCard` UX).

---

## Realtime payloads

### DeviceLocation

From `types/location.ts` — the only location shape on the wire:

```typescript
interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;  // meters
  timestamp?: number;        // ms since epoch — required for stale detection
}
```

**Cadence:** ~3 s foreground, matching `locationService` (`timeInterval: 3000`, `distanceInterval: 5`).

**Privacy:** broadcast to session members only. **Never persist** to a history table.

---

### Location update (realtime message)

```typescript
interface LocationUpdate {
  sessionId: string;
  userId: string;
  location: DeviceLocation;
}
```

**Channel:** `session:{sessionId}:locations`

**Client publish:** `services/locationService.ts` → `startWatching()` (TODO marked in code).

**Client subscribe:** `hooks/useLiveFriends.ts` replaces `friendSimulator` in production.

---

### Member presence

```typescript
interface PresenceEvent {
  sessionId: string;
  userId: string;
  type: 'joined' | 'left';
  timestamp: string;         // ISO 8601
  member: MemberSnapshot;    // see below
}
```

**Channel:** `session:{sessionId}:presence`

Fires when a device joins or leaves. Client adds/removes roster entries live (Phase 3 milestone).

---

### Member snapshot

Minimum roster shape the client needs to render a `Friend`. Server sends this; client enriches with computed fields.

```typescript
interface MemberSnapshot {
  id: string;                // userId
  name: string;
  initials: string;
  hue: MarkerHue;            // stable per-user or assigned on join — see constants/colors.ts
  batteryPercent: number;    // reported by device (expo-battery, Phase 4)
  declaredStatus?: DeclaredStatus;
  coordinationStatus?: CoordinationStatus;  // Phase 5
  device?: string;
}
```

**Client-computed fields** (not on wire in v1):

| Field | Source |
|-------|--------|
| `proximityStatus` | `proximityEngine` from user + member GPS |
| `status` (display) | `mergeDisplayStatus()` in `types/status.ts` |
| `position` (map) | `mapProjection.projectFromOrigin()` |
| `distanceFromUserMiles` | Haversine via `distance.ts` |
| `lastSeenMinutesAgo` | derived from `location.timestamp` |

See `docs/proximity-model.md` — v1 proximity is **user-relative**.

---

### Declared status update

When a member taps a quick action (`QuickAction` in `types/group.ts`):

```typescript
interface DeclaredStatusUpdate {
  sessionId: string;
  userId: string;
  declaredStatus: DeclaredStatus;  // types/status.ts
  timestamp: string;
}
```

**Mapping** (client: `quickActionToDeclaredStatus`):

| QuickAction | DeclaredStatus |
|-------------|----------------|
| `im_good` | `im_good` |
| `heading_home` | `heading_home` |
| `end_night` | `home_safe` |

**Channel:** `session:{sessionId}:declared`

**Client publish:** `HomeScreen` `handleAction` (currently `console.log`).

---

## Status vocabulary

Three layers — see `types/status.ts`:

```typescript
type ProximityStatus = 'with_group' | 'nearby' | 'drifting' | 'separated';
type DeclaredStatus = 'im_good' | 'heading_home' | 'home_safe';
type CoordinationStatus = 'at_meeting_point' | 'heading_to_point' | 'cant_make_it' | 'no_response';  // Phase 5

// Display precedence: coordination > declared > proximity
type DisplayStatus = ProximityStatus | DeclaredStatus | CoordinationStatus;
```

**Server responsibility in v1:** store and broadcast `declaredStatus` (and later `coordinationStatus`). Proximity is computed client-side.

---

## Awareness events

`AwarenessEvent` in `types/awareness.ts` is **client-local** in v1 — derived by `awarenessEngine` from proximity transitions, battery, and stale timestamps.

```typescript
interface AwarenessEvent {
  id: string;
  friendId: string;
  type: AwarenessEventType;
  message: string;
  timestamp: number;
  dismissed?: boolean;
}
```

Push notifications (Phase 6) may fan out from the same transition logic server-side later. No awareness table required in v1.

---

## REST / RPC operations

| Operation | Phase | Request | Response |
|-----------|-------|---------|----------|
| `createSession` | 2 | `{ name, vibeKey }` | `Session` + `Membership` (host) |
| `joinSession` | 3 | `{ inviteCode }` | `Session` + `Membership` + `MemberSnapshot[]` |
| `getSession` | 2 | `{ sessionId }` | `Session` + roster |
| `endSession` | 2 | `{ sessionId }` | `{ endedAt }` — server enforces teardown |
| `leaveSession` | 3 | `{ sessionId }` | `{ leftAt }` |
| `updateDeclaredStatus` | 2+ | `{ sessionId, declaredStatus }` | ack |

---

## Session lifecycle

```
createSession
  → host receives inviteCode
  → share link regroup://join/{inviteCode}
  → members join (joinSession)
  → realtime: locations + presence + declared
  → endSession (host or end_night quick action)
  → server sets endedAt
  → purge / stop broadcasting location channel
  → clients clear live state
```

**End session is server-enforced.** The privacy promise ("when the night ends, sharing ends") must not be client-only. Wire to `QuickAction 'end_night'` in `HomeScreen`.

**Verification (Phase 7):** automated test that zero location rows survive `endedAt`.

---

## Client swap points

| Client module | Today | After backend |
|---------------|-------|---------------|
| `store/useGroupStore.ts` `createGroup` | Retints mock group | `createSession` mutation → `setActive` |
| `store/useGroupStore.ts` boot | `mockGroup` | `loadActiveSession(sessionId)` |
| `services/locationService.ts` | Local GPS only | Publish each fix to `session:{id}:locations` |
| `hooks/useLiveFriends.ts` | `friendSimulator` (`__DEV__`) | Subscribe to location channel |
| `features/map/screens/HomeScreen.tsx` `handleAction` | `console.log` | Publish `DeclaredStatusUpdate` |
| `hooks/useAwarenessLoop.ts` | Local transition detector | Unchanged in v1 (client-side) |
| `services/proximityEngine.ts` | User-relative Haversine | Unchanged in v1 |
| `services/mapProjection.ts` | Local projection | Unchanged until Phase 4 map scale |

---

## MapCanvas contract

Stable UI seam — backend does not change this:

```typescript
MapCanvas({
  width: number;
  height: number;
  friends: Friend[];
  positions?: Record<string, MapPosition>;  // friendId → projected position
  userPosition?: MapPosition;               // from useUserMapPosition
  onFriendPress?: (friend: Friend) => void;
})
```

---

## Explicitly NOT in v1

- Location history / route replay
- Permanent friend graph or followers
- Server-side proximity computation (client derives bands)
- Push notifications (Phase 6)
- Coordination / regroup rally (Phase 5)
- Group-centroid distance (Phase 4 — see `docs/proximity-model.md`)
- Background location upload (Phase 6)

---

## Suggested Supabase shape (reference)

Not prescriptive — the spike in Phase 1 may adjust.

**Tables (persistent):**

- `users` — id, display_name, initials, created_at
- `sessions` — id, name, vibe_key, invite_code, host_user_id, created_at, ended_at
- `memberships` — session_id, user_id, role, joined_at, left_at

**Realtime (ephemeral):**

- Broadcast channel per session for `LocationUpdate`
- Presence for join/leave
- No `location_history` table

**Row Level Security:** members of a session can read session roster and receive location broadcasts; only self can publish own location.

---

## Type index

| Concept | File |
|---------|------|
| `DeviceLocation`, `MapPosition`, `GeoCoordinate` | `types/location.ts` |
| `Friend`, `CurrentUser` | `types/friend.ts` |
| `Group`, `DraftGroup`, `QuickAction`, `GroupVibeKey` | `types/group.ts` |
| `ProximityStatus`, `DeclaredStatus`, `CoordinationStatus`, `DisplayStatus` | `types/status.ts` |
| `AwarenessEvent` | `types/awareness.ts` |

When types and this doc diverge, **types win** — update this doc in the same PR.
