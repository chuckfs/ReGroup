import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { getUserId } from '@/services/authService';
import type { DeclaredStatus, DeclaredStatusUpdate } from '@/types/status';

const DECLARED_UPDATED_EVENT = 'declared_updated';

type FriendDeclaredHandler = (update: DeclaredStatusUpdate) => void;

let declaredChannel: RealtimeChannel | null = null;
let declaredSessionId: string | null = null;
let declaredSharingActive = false;
let currentUserId: string | null = null;
let friendDeclaredHandler: FriendDeclaredHandler | null = null;

export function sessionDeclaredChannel(sessionId: string): string {
  return `session:${sessionId}:declared`;
}

export function onFriendDeclared(handler: FriendDeclaredHandler | null): void {
  friendDeclaredHandler = handler;
}

/** Stop accepting sends/receives before session teardown broadcasts. */
export function deactivateSessionDeclared(): void {
  declaredSharingActive = false;
}

export function getActiveDeclaredSessionId(): string | null {
  return declaredSharingActive ? declaredSessionId : null;
}

async function subscribeChannel(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        reject(new Error(`Declared channel subscribe failed: ${status}`));
      }
    });
  });
}

export async function leaveSessionDeclared(): Promise<void> {
  declaredSharingActive = false;
  currentUserId = null;

  if (!declaredChannel) {
    declaredSessionId = null;
    return;
  }

  await supabase.removeChannel(declaredChannel);
  declaredChannel = null;
  declaredSessionId = null;
}

export async function attachSessionDeclared(sessionId: string): Promise<void> {
  if (declaredChannel && declaredSessionId === sessionId && declaredSharingActive) {
    return;
  }

  await leaveSessionDeclared();

  currentUserId = await getUserId();

  const channel = supabase.channel(sessionDeclaredChannel(sessionId));

  channel.on('broadcast', { event: DECLARED_UPDATED_EVENT }, ({ payload }) => {
    if (!declaredSharingActive) return;

    const update = payload as DeclaredStatusUpdate;
    if (update.sessionId !== declaredSessionId) return;
    if (currentUserId && update.userId === currentUserId) return;

    if (__DEV__) {
      console.log('[ReGroup] declared received:', update.userId, update.declaredStatus);
    }

    friendDeclaredHandler?.(update);
  });

  await subscribeChannel(channel);

  declaredChannel = channel;
  declaredSessionId = sessionId;
  declaredSharingActive = true;

  if (__DEV__) {
    console.log('[ReGroup] declared channel attached:', sessionId);
  }
}

export async function broadcastDeclaredStatus(
  declaredStatus: DeclaredStatus,
): Promise<void> {
  if (!declaredSharingActive || !declaredSessionId || !currentUserId) {
    throw new Error('No active session for declared status broadcast');
  }

  const update: DeclaredStatusUpdate = {
    sessionId: declaredSessionId,
    userId: currentUserId,
    declaredStatus,
    timestamp: Date.now(),
  };

  await broadcastDeclaredUpdate(update);
}

export async function broadcastDeclaredUpdate(
  update: DeclaredStatusUpdate,
): Promise<void> {
  if (!declaredSharingActive) return;
  if (update.sessionId !== declaredSessionId) return;

  const channel =
    declaredChannel && declaredSessionId === update.sessionId
      ? declaredChannel
      : supabase.channel(sessionDeclaredChannel(update.sessionId));

  const ephemeral = channel !== declaredChannel;

  if (ephemeral) {
    await subscribeChannel(channel);
  }

  await channel.send({
    type: 'broadcast',
    event: DECLARED_UPDATED_EVENT,
    payload: update,
  });

  if (__DEV__) {
    console.log('[ReGroup] declared sent:', update.userId, update.declaredStatus);
  }

  if (ephemeral) {
    await supabase.removeChannel(channel);
  }
}
