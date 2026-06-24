import { deactivateSessionCoordination } from '@/services/coordinationService';
import { resetBatteryCache } from '@/services/batteryService';
import { mapProjection } from '@/services/mapProjection';
import { awarenessEngine } from '@/services/awarenessEngine';
import { deactivateSessionDeclared } from '@/services/sessionDeclaredService';
import { deactivateSessionLocations } from '@/services/sessionLocationService';
import { useCoordinationStore } from '@/store/useCoordinationStore';
import { useUIStore } from '@/store/useUIStore';

/**
 * Clear ephemeral live-session client state (map anchor, awareness tracker,
 * battery cache). Call when a session ends locally or remotely.
 *
 * Location channel removal is handled separately via `leaveSessionChannel`.
 * `deactivateSessionLocations` stops in-flight GPS from broadcasting first.
 */
export function resetLiveSessionClientState(): void {
  deactivateSessionLocations();
  deactivateSessionDeclared();
  deactivateSessionCoordination();
  useCoordinationStore.getState().clearRally();
  mapProjection.reset();
  awarenessEngine.reset();
  resetBatteryCache();
  useUIStore.getState().clearAwarenessEvents();
}
