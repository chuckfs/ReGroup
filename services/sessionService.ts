import type { RealtimeChannel } from '@supabase/supabase-js';

import { markerHues, type MarkerHue } from '@/constants';
import { supabase } from '@/lib/supabase';
import { ensureSignedIn, ensureUserProfile, getUserId } from '@/services/authService';
import type { CurrentUser, Friend } from '@/types/friend';
import type { Group, GroupVibeKey } from '@/types/group';

const SESSION_ENDED_EVENT = 'session_ended';

type SessionRow = {
  id: string;
  name: string;
  vibe_key: string | null;
  invite_code: string;
  host_user_id: string;
  created_at: string;
  ended_at: string | null;
};

type MemberSnapshotRow = {
  id: string;
  name: string;
  initials: string;
  hue: string;
  role: 'host' | 'member';
  joined_at: string;
};

type SessionPayload = {
  session: SessionRow;
  members: MemberSnapshotRow[];
};

export type SessionEndedPayload = {
  endedBy: string;
  timestamp: number;
};

type SessionEndedHandler = (payload: SessionEndedPayload) => void;

let controlChannel: RealtimeChannel | null = null;
let controlSessionId: string | null = null;
let sessionEndedHandler: SessionEndedHandler | null = null;

export function sessionControlChannel(sessionId: string): string {
  return `session:${sessionId}:control`;
}

export function onSessionEnded(handler: SessionEndedHandler | null): void {
  sessionEndedHandler = handler;
}

function toMarkerHue(hue: string): MarkerHue {
  if (hue in markerHues) return hue as MarkerHue;
  return 'electric';
}

function memberCountLabel(count: number): string {
  return count === 1 ? '1 person' : `${count} people`;
}

function toFriend(snapshot: MemberSnapshotRow): Friend {
  return {
    id: snapshot.id,
    name: snapshot.name,
    initials: snapshot.initials,
    hue: toMarkerHue(snapshot.hue),
    status: 'with_group',
    batteryPercent: 100,
    lastSeenMinutesAgo: 0,
    position: { x: 0.5, y: 0.5 },
  };
}

function payloadToGroup(payload: SessionPayload, currentUserId: string): Group {
  const self = payload.members.find((member) => member.id === currentUserId);

  const user: CurrentUser = {
    id: currentUserId,
    name: self?.name ?? 'You',
    initials: self?.initials ?? 'YOU',
    batteryPercent: 100,
    status: 'with_group',
  };

  const members = payload.members
    .filter((member) => member.id !== user.id)
    .map(toFriend);

  return {
    id: payload.session.id,
    name: payload.session.name,
    vibeKey: (payload.session.vibe_key as GroupVibeKey | null) ?? undefined,
    inviteCode: payload.session.invite_code,
    vibe: memberCountLabel(payload.members.length),
    members,
    user,
  };
}

function isSessionUnavailableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('session has ended') ||
    lower.includes('not a member') ||
    lower.includes('session not found')
  );
}

async function subscribeChannel(channel: RealtimeChannel): Promise<void> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        reject(new Error(`Channel subscribe failed: ${status}`));
      }
    });
  });
}

export async function leaveSessionChannel(): Promise<void> {
  if (!controlChannel) return;

  await supabase.removeChannel(controlChannel);
  controlChannel = null;
  controlSessionId = null;
}

/**
 * Subscribe to session control broadcasts (e.g. remote `session_ended`).
 * Stream 4 will call this after create/load.
 */
export async function attachSessionControl(sessionId: string): Promise<void> {
  if (controlChannel && controlSessionId === sessionId) return;

  await leaveSessionChannel();

  const channel = supabase.channel(sessionControlChannel(sessionId));

  channel.on('broadcast', { event: SESSION_ENDED_EVENT }, ({ payload }) => {
    const ended = payload as SessionEndedPayload;
    if (__DEV__) {
      console.log('[ReGroup] session_ended received:', ended);
    }
    sessionEndedHandler?.(ended);
  });

  await subscribeChannel(channel);

  controlChannel = channel;
  controlSessionId = sessionId;
}

export async function createSession(draft: {
  name: string;
  vibeKey: GroupVibeKey;
}): Promise<Group> {
  await ensureSignedIn();

  const { data, error } = await supabase.rpc('create_session', {
    p_name: draft.name,
    p_vibe_key: draft.vibeKey,
  });

  if (error) throw error;
  if (!data) throw new Error('create_session returned no data');

  const userId = await getUserId();
  const group = payloadToGroup(data as SessionPayload, userId);

  if (__DEV__) {
    console.log('[ReGroup] session created:', group.id, group.inviteCode);
  }

  await attachSessionControl(group.id);

  return group;
}

export async function getSession(sessionId: string): Promise<Group | null> {
  await ensureSignedIn();
  await ensureUserProfile();

  const { data, error } = await supabase.rpc('get_session', {
    p_session_id: sessionId,
  });

  if (error) {
    if (isSessionUnavailableError(error.message)) return null;
    throw error;
  }

  if (!data) return null;

  const userId = await getUserId();
  const group = payloadToGroup(data as SessionPayload, userId);
  await attachSessionControl(group.id);

  return group;
}

export async function endSession(sessionId: string): Promise<void> {
  await ensureSignedIn();
  const userId = await getUserId();

  const channel =
    controlChannel && controlSessionId === sessionId
      ? controlChannel
      : supabase.channel(sessionControlChannel(sessionId));

  if (channel !== controlChannel) {
    await subscribeChannel(channel);
  }

  const endedPayload: SessionEndedPayload = {
    endedBy: userId,
    timestamp: Date.now(),
  };

  await channel.send({
    type: 'broadcast',
    event: SESSION_ENDED_EVENT,
    payload: endedPayload,
  });

  const { error } = await supabase.rpc('end_session', {
    p_session_id: sessionId,
  });

  if (error) throw error;

  if (__DEV__) {
    console.log('[ReGroup] session ended:', sessionId);
  }

  await leaveSessionChannel();
}
