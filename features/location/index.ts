/**
 * Location feature module — placeholder.
 *
 * Today: mock movement is handled entirely by
 * `services/mockLocationEngine.ts`. Components subscribe via
 * `hooks/useMockLocation.ts`.
 *
 * Production swap:
 *   1. Replace `mockLocationEngine` with `services/locationService.ts`
 *      that uses `expo-location`:
 *        - foreground tracking when the app is open
 *        - background tracking via TaskManager when "night mode" is on
 *   2. Pipe each device update into the realtime channel (Supabase
 *      Realtime / WebSocket) keyed by `(groupId, userId)`.
 *   3. The rest of the app keeps consuming positions through
 *      `useMockLocation`, renamed `useFriendPositions`.
 *
 * Privacy notes: we never persist raw GPS history client-side; only the
 * most recent point per friend is held in memory.
 */
export {} from '@/types';
