# Supabase — ReGroup backend

Phase 2 database schema, RLS, and session RPCs. Location is **never** stored here — only session metadata.

## Prerequisites

1. Supabase project (same project used for the Phase 1 spike is fine)
2. **Authentication → Providers → Anonymous** enabled
3. Migration applied (below)

## Apply migration

**Option A — Dashboard**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste contents of `migrations/20260615120000_phase2_schema.sql`
3. Run

**Option B — CLI** (when project is linked)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Schema

| Table | Purpose |
|-------|---------|
| `users` | Profile row per `auth.users` id (`display_name`, `initials`) |
| `sessions` | A night out (`name`, `vibe_key`, `invite_code`, `host_user_id`, `ended_at`) |
| `memberships` | Who is in which session (`host` / `member`) |

## RPCs

| Function | Caller | Returns |
|----------|--------|---------|
| `ensure_user_profile(display_name?, initials?)` | authenticated | `users` row |
| `create_session(name, vibe_key?)` | authenticated host | `{ session, members }` jsonb |
| `get_session(session_id)` | session member | `{ session, members }` jsonb |
| `end_session(session_id)` | session host | `{ session_id, ended_at }` jsonb |

`join_session` is **Phase 3**.

## Manual verification (SQL Editor)

After signing in anonymously from the app or JS console, run as that user via RPC:

```sql
-- Replace with a real JWT context in the client; in SQL editor use service role
-- or test from the app once Stream 2 lands.

select public.create_session('Brooklyn Nights', 'nightlife');
```

From the client (Stream 2+):

```typescript
const { data, error } = await supabase.rpc('create_session', {
  p_name: 'Brooklyn Nights',
  p_vibe_key: 'nightlife',
});
```

Expected `data.session`: server-assigned `id`, `invite_code` (e.g. `BROO-7G3X`), `ended_at: null`.  
Expected `data.members`: one host row matching `auth.uid()`.

```typescript
await supabase.rpc('end_session', { p_session_id: data.session.id });
await supabase.rpc('get_session', { p_session_id: data.session.id }); // should error: Session has ended
```

## RLS summary

- Users read/update **own** profile only
- Sessions/memberships: **select** for active members only; **no direct writes** (RPCs only)
- Ended sessions are invisible to `get_session` and session `SELECT` policies

## Related docs

- `docs/backend-contract.md` — wire shapes
- `docs/phase-2.md` — full Phase 2 plan
