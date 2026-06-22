# ReGroup — Build Roadmap

*Planned for a solo developer working nights & weekends. Phases are strictly sequential — each one ends in something you can run and verify before starting the next. Effort is sized S / M / L (relative, not calendar) since pace will vary; treat L phases as "several weekends," S as "a weekend or less."*

---

## Guiding rules (apply to every phase)

- **Every phase ends shippable and verifiable.** No phase is "done" until it runs on a real device and meets its exit criteria.
- **The feature test (from your own `AGENTS.md`):** a thing earns its place only if it helps the crew stay together, reconnect, get home safe, or raise awareness without surveillance. If it fails the test, cut it.
- **Never build two of anything.** You already have two location simulators and two notification systems. One canonical path per concern.
- **The seam is the contract.** The whole client is built to swap simulated data for a backend without touching components. Protect that — define the data shapes once, make the backend produce exactly those shapes.
- **Momentum milestone:** Phase 3 is the first time two real phones see each other. Get there as fast as honestly possible — that's the moment ReGroup becomes real.

---

## Phase 0 — Clear the decks & lock the contract  · **S** · *no backend*

**Goal:** Remove the dead weight and pin down the data contracts so everything after this is additive, not corrective. Pure client work, zero risk, immediate clarity.

**Tasks:**
- Delete dead code: `services/mockLocationEngine.ts`, `hooks/useMockLocation.ts`, the entire unused alerts system (`types/alert.ts`, the `alerts`/`pushAlert`/`acknowledgeAlert`/`selectUnreadAlertCount` API in `store/useUIStore.ts`, and `features/alerts/`), the no-op placeholders in `services/mapProjection.ts` (`projectFriendRelativeToGroup`, `clusterPositions`, `setVenueContext`), and the `@deprecated computeFriendStatus` in `services/statusEngine.ts`.
- Define **one unified status vocabulary** that will serve both the quick actions (I'm Good / Heading Home) and the future ReGroup response states (At Meeting Point / Heading / Can't Make It / No Response). Write it as the canonical `FriendStatus` + a coordination-state type. This prevents the parallel-systems mistake before it happens again.
- Decide the proximity model explicitly: keep **user-relative** distance for now (what `proximityEngine` already does), and either wire `computeGroupCentroid` into the live path or mark it clearly as "Phase 4." No silent dead code.
- Write a short **`docs/backend-contract.md`**: the exact shapes the backend must produce — `DeviceLocation`, a per-friend live update, session/group, membership, invite. These already exist as TS types; this doc makes them the spec.
- Fix the stale "stable contract" note — `MapCanvas` actually takes `(width, height, friends, positions, userPosition, onFriendPress)`.

**Exit criteria:** App still runs in the simulator, `expo lint` is clean, no unused modules remain, and `backend-contract.md` exists.

---

## Phase 1 — Backend decision spike  · **S** · *throwaway code*

**Goal:** Choose the realtime/auth/data stack with a 1–2 day proof, not a comparison doc. You asked to evaluate first — this is that, time-boxed so it doesn't become analysis paralysis.

**Hard requirements to judge against:**
- Lightweight identity that persists across devices (anonymous + display name may be enough for v1 — nightlife users abandon signup friction).
- Presence + low-latency location broadcast (~3 s cadence, matching `locationService`).
- **Ephemeral by design** — easy to purge all location data when a session ends.
- Push notifications path (for backgrounded awareness + regroup alerts).
- First-class React Native / Expo SDK quality.
- Cost behavior at festival scale (many concurrent sessions, congested networks).

**Tasks:**
- Build a throwaway spike: two devices, one channel, broadcast a live value (a counter, then a coordinate). Measure latency and setup friction.
- Spike the top candidate first — **Supabase** (Realtime + Postgres + Auth) is the recommended default because every `TODO(backend)` in the code already assumes it and Postgres cleanly models sessions/memberships. Spike a fallback only if time allows — **Firebase** (RTDB/Firestore + Auth) is the main alternative; a custom WebSocket gateway only if you ever outgrow both.
- Fill a one-page decision matrix, pick one, write the rationale.

**Exit criteria:** Stack chosen; a spike repo proves two real devices exchange a live value; a short written rationale exists.

> Phases 0 and 1 are both small and independent — fine to do in the same couple of weekends, in either order.

---

## Phase 2 — Auth & session lifecycle  · **M** · *backbone begins*

**Goal:** Real accounts (lightweight) and real sessions that exist server-side, can be created, and can truly end.

**Tasks:**
- Stand up the chosen backend. Implement the lightest auth that gives a stable identity across devices.
- Data model: `users`, `sessions` (the "group"/"night"), `memberships`, `invite_codes`. Sessions carry `created_at` and an `ended` state.
- Replace the retint hack in `store/useGroupStore.ts` `createGroup` with a real server mutation that returns the canonical session (server-assigned id, roster). Wire the `loadActiveGroup(sessionId)` thunk the comments already describe.
- Implement **End Session** for real: `services` call marks the session ended and triggers teardown. This is the privacy promise made into a system property — wire it to the existing `end_night` quick action (currently a `console.log` in `HomeScreen`).

**Exit criteria:** You can create a session on one device, it persists server-side, and ending it is enforced by the server (not just local UI).

---

## Phase 3 — Join flow  · **M** · *first multiplayer milestone* 🎉

**Goal:** A second person actually joins your session. This is the moment the app stops being single-player.

**Tasks:**
- Add the deep-link handler for `regroup://join/{code}` (via `expo-linking`) plus a real `app/(modals)/join/[code].tsx` route and a join screen. Today `InviteCard` shares that link but **nothing handles it** — there is no join route. Close that loop.
- Invite-code validation → membership creation → roster sync.
- Live roster: when Device B joins, it appears on Device A using the backend's presence/subscription.

**Exit criteria:** Device B taps the shared link or enters the code and appears in Device A's group roster, live. Celebrate this one.

---

## Phase 4 — Live location sharing  · **L** · *the actual core*

**Goal:** Real per-device GPS flowing to every member in real time, replacing the simulator.

**Tasks:**
- In `services/locationService.ts`, broadcast each fix to the session channel keyed by `(sessionId, userId)` — the `TODO(realtime)` already marked in `startWatching`.
- Point `hooks/useLiveFriends.ts` at real realtime positions instead of `friendSimulator`. Keep `friendSimulator` behind `__DEV__` so you can still test solo on one device.
- Fix the map for real-world scale: `services/mapProjection.ts` hardcodes `spanMeters: 1500`, which clamps anyone past ~750 m to the screen edge — useless for festivals/theme parks. Add adaptive span / auto-fit-to-group, and basic pan/zoom (or auto-frame the crew).
- Add **per-device battery reporting** (`expo-battery`, not currently a dependency) so low-battery awareness is real instead of read from mock data.
- Keep it ephemeral: positions live in the transient channel / memory, never written to a history table.

**Exit criteria:** Two real phones see each other move on the map in near-real-time with correct proximity status; `awarenessEngine` fires events on genuine transitions.

---

## Phase 5 — ReGroup Action  · **L** · *the differentiator*

**Goal:** The verb. Coordination layered on top of awareness — the thing that sets ReGroup apart from dots-on-a-map. Build the sub-features in feasibility order.

**Tasks:**
- **5a · Meet Me Here (do first):** any member broadcasts their current fix as the rally point + a push notification to the group. Make the ReGroup button the primary action of an active session. Cheapest to build, ~80% of the real-world value.
- **5b · Response states (mandatory, not optional):** At Meeting Point / Heading To Point / Can't Make It / **No Response**. Coordination is worse than useless if half the group silently ignores it — "No Response" is the most important state. Reuse the unified status vocabulary from Phase 0; do **not** build a second status system.
- **5c · Navigation to the point:** a bearing + distance "hotter/colder" arrow built from the existing `services/geo.ts` (`bearingDegrees` + distance), with optional hand-off to Apple/Google Maps. At festivals, off-grid walking directions are weak, so the in-app arrow is the differentiator.
- **5d · Custom Location (blocked on real map tiles):** dropping a named pin ("Rainbow Arch") requires an actual geographic map — the current `MapAtmosphere`/`MapPaths` canvas is decorative SVG you can't drop a real pin onto. This forces a MapKit/Mapbox decision; fold that decision into Phase 4's map work and the pin UI here.
- **5e · Last Together (ship last, conservative):** needs continuous group-centroid + cohesion tracking and session-scoped storage that is **purged on End Session**. Best story, highest reliability risk — if it points to the wrong spot it destroys trust. Gate it behind real centroid logic and only show it when confidence is high.

**Exit criteria:** Any member can initiate a regroup, everyone is notified, and the initiator can see who's coming.

---

## Phase 6 — Reliability, power & edge cases  · **L** · *survive a real night out*

**Goal:** Make it trustworthy when conditions are bad — which, at events, is always.

**Tasks:**
- **Power strategy** (this is also a differentiator): coordination-first GPS ramping — high-frequency fixes only during an active regroup, low-power passive otherwise. The app that finds your friends shouldn't kill the battery you need to find them.
- **Background behavior:** the app is foreground-only today (`locationService` only requests foreground permission). Add background location permission + a sane background update strategy — most of a night out happens with the app backgrounded.
- **Push notifications** (`expo-notifications`, the existing `TODO(push)`) for awareness + regroup alerts when backgrounded.
- **Offline / no-signal:** show last-known position with a clear timestamp; degrade gracefully instead of showing stale data as live.
- **Partial-group states:** someone never joined, denied permission, dropped off — handle them explicitly in the UI.

**Exit criteria:** The app behaves sanely when phones background, lose signal, and batteries die.

---

## Phase 7 — Privacy hardening & closed beta  · **M** · *prove it for real*

**Goal:** Make the privacy promise defensible and put it in front of real users at a real event.

**Tasks:**
- **Verify session-end purges everything** — automated check that no location data survives a closed session. This is the claim the whole brand rests on; treat it as a test, not a hope.
- Add a **consent/visibility surface:** who can see me right now, for how long, and an instant "stop sharing" that severs the channel.
- **Loud-venue onboarding:** make join near-instant (QR code alongside the link), since cold-start happens in bad conditions.
- **Closed beta:** one or two real friend groups at an actual event. Gather qualitative feedback; instrument nothing creepy.
- Final polish pass on the core loop: join → live → regroup → reconnect → end.

**Exit criteria:** A real friend group used ReGroup at a real event and would use it again.

---

## Where to start this week

Phase 0. It's small, it's all deletion and definition, it has zero dependencies, and it leaves the codebase honest before you build on it. Pair it with the Phase 1 spike if you've got the appetite — together they're the cheapest path to a confident "go." Don't touch Phases 4–5 until two phones can see each other (Phase 3); that's the line between a prototype and a product.

---

### Phase map at a glance

| Phase | Focus | Size | Multiplayer? |
|---|---|---|---|
| 0 | Cleanup + contract | S | no |
| 1 | Backend spike | S | no |
| 2 | Auth + session lifecycle | M | partial |
| 3 | Join flow | M | **yes — first milestone** |
| 4 | Live location sharing | L | yes |
| 5 | ReGroup Action | L | yes |
| 6 | Reliability, power, background | L | yes |
| 7 | Privacy hardening + beta | M | yes |
