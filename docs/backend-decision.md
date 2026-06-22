# ReGroup Backend Decision

*Phase 1 exit artifact. Spike repo: `DevSpikes/regroup-realtime-spike` (throwaway). Contract: `backend-contract.md`.*

**Decision: Supabase** (Auth + Realtime Broadcast + Postgres for session metadata).

**Date:** June 2026  
**Status:** Locked for Phase 2+

---

## Spike summary

All five Phase 1 streams were run against a single Supabase project with Expo SDK 54 and anonymous auth.

| Stream | What was proven |
|--------|-----------------|
| 1 — Setup | Anonymous auth, env vars, Supabase client on Expo |
| 2 — Counter | Two devices exchange live broadcast on `spike:room:demo` |
| 3 — GPS | `DeviceLocation` fixes at ~3 s cadence, cross-device (observed SF ↔ NJ) |
| 4 — Teardown | `session_ended` broadcast stops sharing and clears state on both devices |
| 5 — Decision | This document |

**Observed latency:** low hundreds of ms for counter and GPS payloads on cellular + Wi‑Fi (sufficient for awareness, not turn-by-turn navigation).

**Setup friction:** Supabase project + anonymous auth toggle + two env vars + `npx expo start`. Under an hour for a working two-phone proof.

---

## Decision matrix

Scored **Strong / Adequate / Weak** against Phase 1 hard requirements.

| Requirement | Supabase | Firebase | Custom WebSocket |
|-------------|----------|----------|------------------|
| Lightweight identity (anonymous → display name) | **Strong** — anonymous auth spiked; upgrade path to email/OTP later | **Strong** — anonymous auth built-in | **Weak** — build auth from scratch |
| Realtime location broadcast (~3 s) | **Strong** — Broadcast spiked; fits `DeviceLocation` wire shape | **Strong** — RTDB onValue / Firestore listeners | **Adequate** — full control, weeks of work |
| Ephemeral by design | **Strong** — no location tables; broadcast-only + channel teardown spiked | **Adequate** — no history if you never write it; TTL rules are client-discipline | **Strong** — if you never persist, but you still build everything |
| Push notification path | **Adequate** — Expo Notifications + Edge Functions or third-party; not spiked | **Strong** — FCM native | **Weak** — integrate FCM yourself |
| Expo / React Native SDK quality | **Strong** — `@supabase/supabase-js` works in spike | **Strong** — mature RN SDKs | **Weak** — no SDK; socket client + ops |
| Festival-scale cost behavior | **Adequate** — concurrent connections + messages are the cost center; monitor in beta | **Adequate** — similar fan-out economics; different pricing shape | **Weak** — infra + engineering cost dominates early |
| Session/membership data model | **Strong** — Postgres + RLS maps cleanly to `sessions` / `memberships` | **Adequate** — Firestore works; relational joins are awkward | **Strong** — if you design it, but slow to ship |
| Alignment with existing codebase | **Strong** — every `TODO(backend)` already assumes Supabase | **Weak** — rewrite contract assumptions | **Weak** — greenfield gateway |

**Winner: Supabase** — only option both spiked on real devices and aligned with the locked backend contract.

---

## Rationale

### Why Supabase

1. **Proven on real hardware.** Counter, GPS, and teardown all worked between two phones. The riskiest unknown — “can Expo devices exchange live data through Supabase Broadcast?” — is answered yes.

2. **Matches the architecture we already locked.** `backend-contract.md` specifies session-scoped broadcast channels, Postgres for durable session metadata only, and no location history tables. Supabase maps 1:1 without bending the client.

3. **Ephemeral location is natural.** Location lives on Realtime Broadcast channels in memory. Session end = stop publishing + `session_ended` signal + leave channel. No accidental persistence if we never create a `location_history` table (Phase 7 verification).

4. **Solo-dev velocity.** One vendor for auth, realtime, and relational data. Phase 2 (`createSession`, `endSession`, RLS) is a straight line from the spike, not a platform migration.

5. **Anonymous auth fits the product.** Nightlife users resist signup friction. Anonymous session identity spiked cleanly; display name can layer on in Phase 2 without changing the realtime path.

### Why not Firebase

Firebase would work for realtime location, but:

- Every client `TODO(backend)` and `backend-contract.md` already assume Supabase.
- Firestore is a poor fit for invite-code uniqueness and session lifecycle queries Postgres handles in one migration.
- Switching now trades a day of spike savings for weeks of contract + client rewiring.

**Fallback position:** If Supabase realtime proves flaky or uneconomical at beta scale, re-evaluate Firebase or a managed pub/sub (Ably, etc.) before building a custom gateway.

### Why not a custom WebSocket gateway

Maximum control, maximum cost. ReGroup’s v1 bottleneck is shipping two-phone multiplayer, not websocket throughput. A custom gateway is deferred until we outgrow managed realtime with measured evidence.

---

## Implementation shape (Phase 2+)

| Concern | Supabase piece |
|---------|----------------|
| Identity | Auth (anonymous → optional upgrade) |
| Session metadata | Postgres: `users`, `sessions`, `memberships` |
| Live location | Realtime Broadcast: `session:{id}:locations` |
| Join/leave presence | Realtime Presence on `session:{id}:presence` |
| Session end | `endSession` RPC sets `ended_at`; server rejects joins; clients tear down channels (spike pattern) |
| Declared status | Realtime Broadcast: `session:{id}:declared` |

Location payloads use `DeviceLocation` from `types/location.ts`. Proximity stays client-side per `proximity-model.md`.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Realtime cost at many concurrent sessions | Session-scoped channels; no location DB writes; monitor connection count in beta |
| Congested festival networks | Client already holds latest-fix only; stale detection in `awarenessEngine`; adaptive cadence in Phase 6 |
| Anonymous auth abuse | Rate limits, invite codes, session caps; upgrade path to verified identity if needed |
| Push not spiked | Phase 6 scope; Expo Notifications + server trigger; not a blocker for Phases 2–4 |

---

## Exit criteria (Phase 1)

- [x] Stack chosen: **Supabase**
- [x] Spike proves two real devices exchange live values (counter + GPS)
- [x] Teardown proven ephemeral on both devices
- [x] Short written rationale exists (this doc)

**Phase 1 complete.** Next: Phase 2 — auth & session lifecycle in the production app.
