# ReGroup Proximity Model (v1)

*Locked in Phase 0. Do not wire group-centroid distance until Phase 4.*

## Decision

**v1 proximity is user-relative.**

Every friend's distance and status band is computed from **your GPS fix** to **their GPS fix** using Haversine (`services/distance.ts`) and threshold bands in `services/proximityEngine.ts`.

We do **not** compute a group centroid for proximity in v1.

## Why user-relative for v1

- Matches the map UX: you are always centred; friends move relative to you.
- Simpler with one real device + dev simulator — no multi-anchor ambiguity.
- Answers the core question directly: *"How far is this person from me right now?"*
- Fewer moving parts before multiplayer lands (Phase 3–4).

## What "with group" means in v1

`with_group` means **within 150 ft of you**, not "at the group centroid." Copy stays warm and social; the math is honest.

## Thresholds (feet, straight-line)

| Band | Distance from user |
|------|-------------------|
| `with_group` | < 150 ft |
| `nearby` | < 500 ft |
| `drifting` | < 1,000 ft |
| `separated` | ≥ 1,000 ft |

Source of truth: `PROXIMITY_THRESHOLDS_FEET` in `services/proximityEngine.ts`.

## Code paths (v1)

```
User GPS (useLocation)
  → computeFriendProximity(user, friend)     // proximityEngine
  → calculateDistanceFeet(user, friend)    // distance.ts (Haversine)
  → computeProximityStatus(feet)             // proximity bands
  → mergeDisplayStatus(...)                  // types/status.ts
  → Friend.distanceFromUserMiles             // stored on friend object
```

Awareness transitions (`services/awarenessEngine.ts`) track **proximity bands only**, using `effectiveProximity()`.

## Deferred to Phase 4

| Item | Location | Purpose |
|------|----------|---------|
| Group centroid distance | `computeGroupCentroid` in `statusEngine.ts` | "How far from the crew's centre?" |
| Centroid-relative projection | `mapProjection.ts` | Map auto-fit, festival scale |
| Adaptive span / clustering | `mapProjection.ts` | Large venues |
| Rename in summaries | `summarizeGroup` | May count cohesion vs centroid |

`computeGroupCentroid` **exists but is not wired** — intentional. Do not call it from the live path until Phase 4.

## Phase 4 migration (preview)

When live multiplayer + map scale land:

1. Compute centroid from realtime friend GPS fixes.
2. Optionally switch proximity anchor to centroid (or offer both: "from you" / "from crew").
3. Wire `distanceFromUserMiles` alongside `distanceFromCentroidMiles` if both are needed.
4. Update `summarizeGroup` to reflect group cohesion, not just user-relative counts.

## Related docs

- Product principles: `AGENTS.md`
- Backend shapes (Phase 0 Stream 4): `docs/backend-contract.md` (when written)
- Build sequence: `ReGroup-Roadmap.md` Phase 4
