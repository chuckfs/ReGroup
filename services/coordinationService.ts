import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { getUserId } from '@/services/authService';
import { useCoordinationStore } from '@/store/useCoordinationStore';
import type {
  RallyCancelledPayload,
  RallyPoint,
  RallyStartedPayload,
} from '@/types/coordination';
import type { DeviceLocation } from '@/types/location';

const RALLY_STARTED_EVENT = 'rally_started';
const RALLY_CANCELLED_EVENT = 'rally_cancelled';

type RallyStartedHandler = (payload: RallyStartedPayload) => void;
type RallyCancelledHandler = (payload: RallyCancelledPayload) => void;

let coordinationChannel: RealtimeChannel | null = null;
let coordinationSessionId: string | null = null;
let coordinationActive = false;
let currentUserId: string | null = null;
let rallyStartedHandler: RallyStartedHandler | null = null;
let rallyCancelledHandler: RallyCancelledHandler | null = null;

function newRallyId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function sessionCoordinationChannel(sessionId: string): string {
  return `session:${sessionId}:coordination`;
}

export function onRallyStarted(handler: RallyStartedHandler | null): void {
  rallyStartedHandler = handler;
}

export function onRallyCancelled(handler: RallyCancelledHandler | null): void {
  rallyCancelledHandler = handler;
}

/** Stop accepting sends/receives before session teardown broadcasts. */
export function deactivateSessionCoordination(): void {
  coordinationActive = false;
}

export function getActiveCoordinationSessionId(): string | null {
  return coordinationActive ? coordinationSessionId : null;
}

async function subscribeChannel(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        reject(new Error(`Coordination channel subscribe failed: ${status}`));
      }
    });
  });
}

async function broadcastRallyStarted(rally: RallyPoint): Promise<void> {
  const payload: RallyStartedPayload = { rally };

  const channel =
    coordinationChannel && coordinationSessionId === rally.sessionId
      ? coordinationChannel
      : supabase.channel(sessionCoordinationChannel(rally.sessionId));

  const ephemeral = channel !== coordinationChannel;

  if (ephemeral) {
    await subscribeChannel(channel);
  }

  await channel.send({
    type: 'broadcast',
    event: RALLY_STARTED_EVENT,
    payload,
  });

  if (__DEV__) {
    console.log(
      '[ReGroup] rally_started sent:',
      rally.rallyId,
      rally.initiatorName,
    );
  }

  if (ephemeral) {
    await supabase.removeChannel(channel);
  }
}

async function broadcastRallyCancelled(
  payload: RallyCancelledPayload,
): Promise<void> {
  const channel =
    coordinationChannel && coordinationSessionId === payload.sessionId
      ? coordinationChannel
      : supabase.channel(sessionCoordinationChannel(payload.sessionId));

  const ephemeral = channel !== coordinationChannel;

  if (ephemeral) {
    await subscribeChannel(channel);
  }

  await channel.send({
    type: 'broadcast',
    event: RALLY_CANCELLED_EVENT,
    payload,
  });

  if (__DEV__) {
    console.log('[ReGroup] rally_cancelled sent:', payload.rallyId);
  }

  if (ephemeral) {
    await supabase.removeChannel(channel);
  }
}

export async function leaveSessionCoordination(): Promise<void> {
  coordinationActive = false;
  currentUserId = null;

  if (!coordinationChannel) {
    coordinationSessionId = null;
    return;
  }

  await supabase.removeChannel(coordinationChannel);
  coordinationChannel = null;
  coordinationSessionId = null;
}

export async function attachSessionCoordination(sessionId: string): Promise<void> {
  if (
    coordinationChannel &&
    coordinationSessionId === sessionId &&
    coordinationActive
  ) {
    return;
  }

  await leaveSessionCoordination();

  currentUserId = await getUserId();

  const channel = supabase.channel(sessionCoordinationChannel(sessionId));

  channel.on('broadcast', { event: RALLY_STARTED_EVENT }, ({ payload }) => {
    if (!coordinationActive) return;

    const update = payload as RallyStartedPayload;
    if (update.rally.sessionId !== coordinationSessionId) return;
    if (currentUserId && update.rally.initiatorUserId === currentUserId) return;

    if (__DEV__) {
      console.log(
        '[ReGroup] rally_started received:',
        update.rally.initiatorName,
        update.rally.rallyId,
      );
    }

    rallyStartedHandler?.(update);
  });

  channel.on('broadcast', { event: RALLY_CANCELLED_EVENT }, ({ payload }) => {
    if (!coordinationActive) return;

    const update = payload as RallyCancelledPayload;
    if (update.sessionId !== coordinationSessionId) return;

    if (__DEV__) {
      console.log('[ReGroup] rally_cancelled received:', update.rallyId);
    }

    rallyCancelledHandler?.(update);
  });

  await subscribeChannel(channel);

  coordinationChannel = channel;
  coordinationSessionId = sessionId;
  coordinationActive = true;

  if (__DEV__) {
    console.log('[ReGroup] coordination channel attached:', sessionId);
  }
}

export async function cancelRally(rallyId?: string): Promise<void> {
  if (!coordinationActive || !coordinationSessionId) {
    throw new Error('No active session for rally cancel');
  }

  const activeRally = useCoordinationStore.getState().activeRally;
  const targetRallyId = rallyId ?? activeRally?.rallyId;
  if (!targetRallyId) return;

  await broadcastRallyCancelled({
    sessionId: coordinationSessionId,
    rallyId: targetRallyId,
  });

  if (activeRally?.rallyId === targetRallyId) {
    useCoordinationStore.getState().clearRally();
  }
}

export async function startRally(
  location: DeviceLocation,
  initiatorName: string,
  label?: string,
): Promise<RallyPoint> {
  if (!coordinationActive || !coordinationSessionId || !currentUserId) {
    throw new Error('No active session for rally start');
  }

  const activeRally = useCoordinationStore.getState().activeRally;
  if (activeRally && activeRally.sessionId === coordinationSessionId) {
    await broadcastRallyCancelled({
      sessionId: activeRally.sessionId,
      rallyId: activeRally.rallyId,
    });
    useCoordinationStore.getState().clearRally();
  }

  const rally: RallyPoint = {
    sessionId: coordinationSessionId,
    rallyId: newRallyId(),
    initiatorUserId: currentUserId,
    initiatorName,
    location: {
      ...location,
      timestamp: location.timestamp ?? Date.now(),
    },
    createdAt: Date.now(),
    label,
  };

  await broadcastRallyStarted(rally);
  useCoordinationStore.getState().setActiveRally(rally);

  return rally;
}
