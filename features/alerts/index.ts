/**
 * Alerts feature module — placeholder.
 *
 * Today: the `useUIStore.alerts` array is empty. The status engine
 * (`services/statusEngine.ts`) is wired up but no scheduler is calling
 * into it yet.
 *
 * Next milestone:
 *   1. Background scheduler — every N seconds, run the status engine
 *      against the active group and `pushAlert` for any newly tripped
 *      thresholds.
 *   2. Alerts UI — a slide-in toast at the top of the home map for new
 *      alerts, and a sheet to browse the history.
 *   3. Push notifications — pipe the same alert objects through
 *      `expo-notifications` when the app is backgrounded.
 *
 * Keep alert shapes in `/types/alert.ts` so this module and the
 * notification service stay in sync.
 */
export {} from '@/types';
