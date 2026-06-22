# ReGroup — Product & Engineering Audit

*Prepared June 22, 2026. Grounded in a full read of the actual codebase (~7,900 LOC across `app/`, `features/`, `services/`, `hooks/`, `store/`, `types/`), not just the brief. Brutally honest as requested — assume nothing is sacred.*

---

## The one-sentence version

ReGroup has a genuinely tasteful front end and a clean, well-factored client architecture wrapped around a product that **does not yet do the one thing it exists to do** — let multiple phones share location during a session. Today it is a beautifully animated single-device demo where your "friends" are a local GPS simulator walking circles around you. The hard 80% (backend, realtime, join flow, multi-device, persistence-with-deletion) is entirely unbuilt and lives in `TODO(backend)` comments. The strategy questions matter, but they're downstream of one blunt fact: there is no product here yet, only a convincing prototype.

---

## 1. Does the implementation match the vision? (Question 13, answered first — because it reframes everything)

No. The gap is not cosmetic; it's the whole middle of the product.

The vision is fundamentally **multiplayer**: temporary, consent-based, session-scoped location sharing across a group's phones. Almost none of that exists in code.

What's actually wired up in `HomeScreen` → `useLiveFriends` → `friendSimulator`: a single device gets its own GPS fix (`useLocation`/`locationService`), and then `friendSimulator.ts` *fabricates* six friends by walking fake coordinates around your real position with behaviors like `drift_away`, `regroup`, `wander`, `pause`. Proximity, status, and awareness events are all computed against these simulated locals. It looks alive. It is not networked.

Concretely, every multi-user touchpoint is a stub:

- **Join a session** — an MVP feature — does not exist. `InviteCard` shares a `regroup://join/{code}` deep link, but there is no route handler for it (`app/` has no `join` route) and no join screen. You can create and share an invite that goes nowhere.
- **Create session** (`useGroupStore.createGroup`) doesn't create anything. It retints the existing hard-coded `mockGroup` — same six members (`Jake, Maya, Chris…`) reappear with a new name/vibe/id. There is one group, forever.
- **End session** (`QuickAction 'end_night'`) → `console.log('[ReGroup] quick action:', action)`. The flagship privacy promise — *"when the session ends, location sharing ends"* — is literally not implemented. (There's nothing to end, since nothing is shared.)
- **Quick actions** (I'm Good, Heading Home), **ping**, **message**, **directions**, **locate-me**, **chat**, **menu**, **switch group** — every one resolves to `console.log` or `router.push`.

So the front end faithfully *renders* the vision. The system does not *implement* it. The brief's claim that the project is "beyond idea stage and already contains core proximity infrastructure" is half true: the proximity *math* is real and good; the *infrastructure* (anything requiring a second device) is absent.

---

## 2. Technical architecture (Question 7)

This is the strongest part of the project, and it deserves credit.

**What's genuinely good:**

- Clean layering: pure domain types (`types/`), pure stateless engines (`services/proximityEngine`, `distance`, `geo`, `awarenessEngine`), composition hooks (`hooks/`), Zustand stores split sensibly into domain (`useGroupStore`, `useFriendStore`) vs UI/ambient (`useUIStore`). The comment in `useUIStore` — "Mixing them is a smell" — reflects real discipline.
- The awareness engine is the best-designed module in the repo. `AwarenessEngineTracker.evaluate()` is a pure transition detector that emits an event *only on a state change* (`nearby→drifting`, battery crossing a threshold, freshness going stale). That's exactly how you avoid alarm-fatigue, and it matches the "helpful, not alarming" principle. Copy is warm and on-brand ("starting to drift — still close by").
- Engines are written to be swapped for a backend without touching components — consistent `{ friendId, position }` / `DeviceLocation` shapes throughout. Forward-thinking.
- `useLocation` holds only the latest fix in memory, no history. That genuinely honors the "no location history / no route replay" non-goal at the code level.

**What's wrong or worrying:**

- **The "stable contract" has already drifted.** The brief states `MapCanvas(width, height, friends, positions)`. The actual signature is `MapCanvas(width, height, friends, positions, userPosition, onFriendPress)`. Minor, but it means the documented contract is already stale — a sign the brief and code aren't kept in sync.
- **Two overlapping location simulators.** `mockLocationEngine.ts` (normalized 0–1 map-space drift, ~160 LOC) and `friendSimulator.ts` (real lat/lng walking, ~270 LOC) do the same conceptual job. Only `friendSimulator` is used. `mockLocationEngine` and its hook `useMockLocation` are **dead code** — referenced only in a doc comment. That's ~230 LOC of confusion for the next engineer.
- **A second, fully unused notification system.** `types/alert.ts` (the `Alert`/`AlertKind`/`group_split`/`group_reunited` model) and the entire `useUIStore.alerts` API (`pushAlert`, `acknowledgeAlert`, `selectUnreadAlertCount`) are **never called anywhere**. The live system is `AwarenessEvent`. You have two parallel designs for "something changed in the group," one of which is vestigial. Pick one.
- **Placeholder no-ops shipped as API.** `mapProjection.projectFriendRelativeToGroup`, `clusterPositions`, and `setVenueContext` are stubs that return their input or do nothing. `statusEngine.computeFriendStatus` is `@deprecated` in its own file. Dead surface area accumulating before v1.
- **Group reasoning is shallower than advertised.** The vision sells "reasoning about the group as a whole" and a centroid model. In reality, `proximityEngine` computes each friend's distance **from the user**, not from the group centroid. `computeGroupCentroid` exists in `statusEngine` but is not wired into the live path. `summarizeGroup` is a `.filter().length` tally. The marketing examples ("4 together, 2 drifting") are counts, not group-state intelligence. This is fine as an MVP — but don't tell investors it's doing something it isn't.

---

## 3. The map projection is a real technical risk for the stated use cases

`mapProjection` anchors an origin at the user's first GPS fix and projects everyone into a normalized square with a **hardcoded `spanMeters: 1500`**, then clamps to `[0,1]`. That means anyone more than ~750 m from the origin pins to the screen edge, indistinguishable from someone at 751 m or 5 km.

The vision's headline use cases are **festivals, conventions, theme parks, Pride** — environments that routinely span more than 1.5 km. At Coachella or Disney, your whole crew would frequently smear against the border with no zoom, no pan, no scale. There is no camera control anywhere in `MapCanvas`. The map is tuned for "one bar block," not the events the product is being sold on. This needs adaptive span/zoom before any of those use cases are real.

---

## 4. Scalability (Question 8)

Largely **not applicable yet** because there's no server — but the design implies the hard problems, and none are addressed:

- The real cost center will be realtime fan-out: every member broadcasting a GPS fix every 3 s (`watchPositionAsync` is set to `timeInterval: 3000`, `distanceInterval: 5`) to every other member is O(n²) of presence traffic per group. For a 10-person crew that's ~30 messages/sec/group. Manageable per-group; the scaling question is *number of concurrent groups*, and that's a backend you haven't started.
- Proximity is recomputed client-side per tick for all friends. Fine for ≤ a few dozen. Not a concern.
- **Battery** is the silent scalability killer (see §6).
- Choosing Supabase Realtime (per the TODOs) is reasonable for v1, but presence + geo broadcast at festival scale (tens of thousands of devices on congested networks) is exactly where it gets expensive and flaky. Decide deliberately, not by TODO inertia.

---

## 5. Privacy model (Question 6)

The privacy *philosophy* is the best thing about this product, and the client honors it as far as the client can: latest-fix-only, no history, no feed, no followers. Good.

But here's the brutal part: **the privacy model is entirely unproven because the part that's hard to get right doesn't exist.** "We don't store location long-term" is trivially true when there's no store. The actual privacy work — a backend that receives live GPS from many devices and is architected to retain *nothing* after a session, with verifiable deletion, consent revocation that propagates instantly, and a defensible data-retention story — is 100% ahead of you. The promise is a liability until the backend that must keep it is built and audited. Right now it's a marketing claim, not a system property.

Also missing: a per-session consent surface, a visible "who can see me right now" indicator, and an instant "stop sharing" that actually severs the channel. These are the things that make "consent-based, temporary" real rather than aspirational.

---

## 6. Biggest risks and blind spots (Question 10)

**A. It's a feature, not a company — and the incumbent owns your exact users.** The competitive framing in the brief (Life360, Find My) is aiming at the wrong target. Life360 is family/persistent; Find My is Apple-only/persistent/1:1. Your real competitor is **Snapchat's Snap Map** — live friend location, already free, already installed by the exact demographic (young people at festivals, nightlife, Pride), with temporary "ghost mode" sharing baked in. Asking a friend group to download a *new* app for *one night* when Snap Map is already on every phone is a brutal cold-start ask. (Verify current Snap Map feature set — it evolves — but it has been the dominant answer to "where's my crew" for this cohort for years.)

**B. Cold-start network effect at the worst possible moment.** ReGroup is useless unless your whole crew installs and joins *that night*, usually in a loud venue, possibly with bad signal and dying batteries. The moment of need is the worst moment to onboard four people to a new app. This single dynamic kills most "find my friends" startups.

**C. The battery paradox.** Continuous foreground GPS at 3 s intervals drains phones fast. Festivals and nights out are *already* battery death-marches. The app that saves you from losing your friends will kill the battery you need to find them — and your own low-battery alert feature is an admission of the problem. This is existential, not minor, and there's no power-management strategy in the code (no significant-change/region monitoring, no adaptive interval, no background story).

**D. Safety positioning creates liability you can't honor.** The brief leans on "is everyone okay?", "isolated," "separated." The instant you market safety, users *rely* on it — and when it fails (dead battery, no signal, app backgrounded, someone never joined) during a genuine emotional event, you own that failure. Either invest seriously in reliability or soften the safety language to "coordination" to avoid implying a guarantee you can't make.

**E. Blind spot — battery % of *other* people is unobtainable as designed.** Low-battery alerts require each device to report its own battery. `expo-battery` isn't even a dependency; friend battery comes from `mockData` and a dev override. In production this feature can't function without per-device battery reporting over the backend. It's currently theater.

**F. Blind spot — "separated for 22 minutes."** The signature example needs durable per-friend time tracking. Today `lastSeenMinutesAgo` is hardcoded to 0 everywhere and force-set to 0 in `useLiveFriends`. The duration concept the brief sells isn't surfaced anywhere in the UI.

---

## 7. Product-market fit & differentiation (Questions 1, 2)

There *is* a real seam: a single-purpose, beautiful, privacy-respecting, *temporary* group tool that deliberately rejects the surveillance/engagement baggage of Life360 and the persistence of Find My/Snap Map. Some people genuinely dislike always-on location sharing and would welcome "just for tonight." Pride/queer-nightlife framing is a sharp, underserved wedge with real word-of-mouth potential and a community that cares about consent and ephemerality.

But "tasteful and temporary" is a thin moat. Snap Map can add (or has) ephemeral modes; Find My already does temporary 1:1 sharing with an expiry. Differentiation by *values and polish* is real but copyable, and values don't overcome cold-start. The honest PMF question isn't "is this nicer than Life360" (it is) — it's "will a friend group abandon the app already on their phones to adopt this for occasional use." That's unproven and hard.

---

## 8. MVP scope & feature prioritization (Questions 3, 4)

Scope is currently **inverted**: the team has built the delightful, demoable surface (animated map, glassy chips, wizard, atmosphere) and skipped the load-bearing wall (two devices exchanging location). For a product whose entire value is multiplayer, polishing single-player UI first is the wrong order — it produces something that *demos* far better than it *works*, which is a dangerous place to fundraise or user-test from.

Ruthless re-prioritization for a real MVP:

1. **Backend + realtime + auth** — two real phones see each other in one session. Nothing else matters until this exists.
2. **Join flow** — the `regroup://join/{code}` link must actually land somewhere and add you to a live session. Without this there is no group.
3. **End session that truly severs sharing** — the privacy promise, made real, with instant channel teardown.
4. **Power management** — adaptive GPS, background strategy. Non-negotiable for the use case.
5. *Then* the polish that already exists.

Feature prioritization should be governed by your own excellent rule in `AGENTS.md`: every feature must help the crew *stay together, reconnect, get home safe, or raise awareness without surveillance*. Apply it mercilessly.

---

## 9. Features to remove (Question 11)

- **All dead code now**: `mockLocationEngine.ts`, `useMockLocation.ts`, the entire `alerts` system (`types/alert.ts`, `useUIStore.alerts*`, `features/alerts/`), and the no-op `mapProjection` placeholders. Carrying two of everything before v1 is pure drag.
- **"Heading Home" vs "End Night" vs "I'm Good"** overlap conceptually — three buttons where users may want one clear "I'm safe / I'm out" signal. Validate that all three earn their place.
- **Battery % of friends** — unless you commit to per-device battery reporting, cut it rather than fake it.
- **Vibe system** (`features/group/data/vibes.ts`, 8 vibe types with emoji/accent) is lovely but pure decoration right now; it influences nothing functional. Fine to keep as cheap delight, but don't let it absorb engineering time over the backend.

## 10. Features that are missing (Question 12)

- The backend, realtime, auth, and join flow (the product).
- A real **end-session / revoke-sharing** mechanism.
- **Power management** for continuous GPS.
- A **"meet here" / rally-point / ping-with-location** primitive — arguably the single most useful regroup feature and a natural differentiator, currently just a `console.log`.
- **Offline / no-signal graceful degradation** — show last-known + timestamp clearly. Critical in crowded venues.
- **Background behavior** — the app is foreground-only (`requestForegroundPermission` only); the moment it's backgrounded, you stop updating, which is most of a night out.
- **Consent & visibility surface** — who can see me, for how long, stop now.
- Real **time-since-seen** tracking to deliver the "separated for X minutes" promise.

---

## 11. Monetization (Question 9)

This is hard and you should confront it early. ReGroup is, by design, **low-frequency** (a few nights a quarter) and **anti-engagement** (you've correctly rejected feeds, streaks, notifications-for-their-own-sake). Those are the exact levers consumer apps pull to justify subscriptions. A standalone consumer sub for an app opened occasionally is a very steep climb.

More plausible paths, roughly in order of realism:

- **B2B / event-side licensing** — festivals, Pride organizations, conventions, theme parks, universities paying to offer ReGroup (or a white-labeled version) to attendees, bundled with their official event app. This fits the use cases *and* solves cold-start (everyone at the event is nudged to the same tool). Likely your best business.
- **Premium group features** — larger groups, custom rally points, longer/recurring sessions, venue maps. Modest.
- **Safety partnerships** — venue security integration, but tread carefully given the liability in §6D.

Avoid the trap of monetizing via the engagement mechanics you've rightly forsworn. If the business *requires* daily engagement, the product thesis and the business model are in conflict — better to face that now.

---

## 12. User experience (Question 5)

On craft, this is strong: the atmospheric map, glow avatars, glassy quick-action chips, the three-step create wizard with slide/retint choreography, warm awareness copy. It feels like a real product with a point of view, which is rare at this stage and worth protecting.

The UX *risks* are all in the unbuilt parts: onboarding four people in a loud venue; what the map shows when someone hasn't joined / has no signal / is 3 km away (currently: a pin glued to the edge, see §3); how "stop sharing" is surfaced; how the app behaves backgrounded. The polish you have will mean little if the first real multiplayer session is confusing. Pour the next increment of design effort into the *join → live → reconnect → end* loop with real devices, not more atmosphere.

---

## Bottom line

Keep three things: the design sensibility, the clean engine architecture, and the privacy-first/temporary thesis (especially the Pride/nightlife wedge). Those are real assets.

Then confront three hard truths: (1) you have a gorgeous prototype, not a working product — the multiplayer core is entirely unbuilt; (2) your real competitor is Snap Map, already on your users' phones, and cold-start + battery are existential, not minor; (3) the privacy promise and the monetization model are both unproven precisely where they're hardest. Build the backend and the join/end loop on two real phones before adding a single new feature, and pressure-test whether anyone will switch from what they already use for one night out. The answer to that question is the whole ballgame.
