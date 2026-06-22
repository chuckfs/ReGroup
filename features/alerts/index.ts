/**
 * Alerts feature module — awareness events now live in
 * `features/awareness` and `useUIStore.awarenessEvents`.
 *
 * Next milestone:
 *   1. Map awareness events → legacy Alert shapes for history UI
 *   2. Push notifications — pipe awareness events through
 *      `expo-notifications` when the app is backgrounded
 *
 * TODO(push): subscribe to `useUIStore.pushAwarenessEvent` and fan out
 * to expo-notifications for background delivery.
 */
export { AwarenessBanner, AwarenessDevPanel } from '@/features/awareness';
export type { AwarenessEvent, AwarenessEventType } from '@/types/awareness';
