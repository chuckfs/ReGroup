import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { getUserId } from '@/services/authService';
import { locationService } from '@/services/locationService';
import type { DeviceLocation, LocationUpdate } from '@/types/location';

const LOCATION_EVENT = 'location';

type FriendLocationHandler = (update: LocationUpdate) => void;

let locationsChannel: RealtimeChannel | null = null;
let locationsSessionId: string | null = null;
let locationsSharingActive = false;
let currentUserId: string | null = null;
let friendLocationHandler: FriendLocationHandler | null = null;
let publishUnsubscribe: (() => void) | null = null;

function ensureLocationTimestamp(location: DeviceLocation): DeviceLocation {
  return {
    ...location,
    timestamp: location.timestamp ?? Date.now(),
  };
}

function stopPublishingLocations(): void {
  publishUnsubscribe?.();
  publishUnsubscribe = null;
}

function startPublishingLocations(): void {
  if (publishUnsubscribe) return;

  publishUnsubscribe = locationService.subscribe((fix) => {
    if (!locationsSharingActive || !locationsSessionId || !currentUserId) return;

    void broadcastLocation({
      sessionId: locationsSessionId,
      userId: currentUserId,
      location: ensureLocationTimestamp(fix),
    }).catch((error) => {
      if (__DEV__) {
        console.warn('[ReGroup] location broadcast failed:', error);
      }
    });
  });
}

export function sessionLocationChannel(sessionId: string): string {
  return `session:${sessionId}:locations`;
}

export function onFriendLocation(handler: FriendLocationHandler | null): void {
  friendLocationHandler = handler;
}

/** Stop accepting sends/receives before session teardown broadcasts. */
export function deactivateSessionLocations(): void {
  locationsSharingActive = false;
}

export function getActiveLocationSessionId(): string | null {
  return locationsSharingActive ? locationsSessionId : null;
}

async function subscribeChannel(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        reject(new Error(`Location channel subscribe failed: ${status}`));
      }
    });
  });
}

export async function leaveSessionLocations(): Promise<void> {
  locationsSharingActive = false;
  currentUserId = null;
  stopPublishingLocations();

  if (!locationsChannel) {
    locationsSessionId = null;
    return;
  }

  await supabase.removeChannel(locationsChannel);
  locationsChannel = null;
  locationsSessionId = null;
}

export async function attachSessionLocations(sessionId: string): Promise<void> {
  if (locationsChannel && locationsSessionId === sessionId && locationsSharingActive) {
    return;
  }

  await leaveSessionLocations();

  currentUserId = await getUserId();

  const channel = supabase.channel(sessionLocationChannel(sessionId));

  channel.on('broadcast', { event: LOCATION_EVENT }, ({ payload }) => {
    if (!locationsSharingActive) return;

    const update = payload as LocationUpdate;
    if (update.sessionId !== locationsSessionId) return;
    if (currentUserId && update.userId === currentUserId) return;

    if (__DEV__) {
      console.log('[ReGroup] location received:', update.userId);
    }

    friendLocationHandler?.(update);
  });

  await subscribeChannel(channel);

  locationsChannel = channel;
  locationsSessionId = sessionId;
  locationsSharingActive = true;
  startPublishingLocations();

  if (__DEV__) {
    console.log('[ReGroup] location channel attached:', sessionId);
  }
}

export async function broadcastLocation(update: LocationUpdate): Promise<void> {
  if (!locationsSharingActive) return;
  if (update.sessionId !== locationsSessionId) return;

  const channel =
    locationsChannel && locationsSessionId === update.sessionId
      ? locationsChannel
      : supabase.channel(sessionLocationChannel(update.sessionId));

  const ephemeral = channel !== locationsChannel;

  if (ephemeral) {
    await subscribeChannel(channel);
  }

  await channel.send({
    type: 'broadcast',
    event: LOCATION_EVENT,
    payload: update,
  });

  if (__DEV__) {
    console.log('[ReGroup] location sent:', update.userId);
  }

  if (ephemeral) {
    await supabase.removeChannel(channel);
  }
}
