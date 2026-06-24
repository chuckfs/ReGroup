import type { RealtimeChannel } from '@supabase/supabase-js';

import { markerHues, type MarkerHue } from '@/constants';
import { supabase } from '@/lib/supabase';
import { ensureSignedIn, ensureUserProfile, getUserId } from '@/services/authService';
import {
  attachSessionLocations,
  deactivateSessionLocations,
  leaveSessionLocations,
} from '@/services/sessionLocationService';
import type { CurrentUser, Friend } from '@/types/friend';
import type { Group, GroupVibeKey } from '@/types/group';

const SESSION_ENDED_EVENT = 'session_ended';
const ROSTER_UPDATED_EVENT = 'roster_updated';

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

export type RosterUpdatedPayload = {
  sessionId: string;
  timestamp: number;
};

type SessionEndedHandler = (payload: SessionEndedPayload) => void;
type RosterChangedHandler = (group: Group) => void;

let controlChannel: RealtimeChannel | null = null;
let controlSessionId: string | null = null;
let presenceSessionId: string | null = null;
let sessionEndedHandler: SessionEndedHandler | null = null;
let rosterChangedHandler: RosterChangedHandler | null = null;

export function sessionControlChannel(sessionId: string): string {
  return `session:${sessionId}:control`;
}

export function onSessionEnded(handler: SessionEndedHandler | null): void {
  sessionEndedHandler = handler;
}

export function onRosterChanged(handler: RosterChangedHandler | null): void {
  rosterChangedHandler = handler;
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

async function refreshSession(sessionId: string): Promise<Group | null> {
  await ensureSignedIn();

  const { data, error } = await supabase.rpc('get_session', {
    p_session_id: sessionId,
  });

  if (error) {
    if (isSessionUnavailableError(error.message)) return null;
    throw error;
  }

  if (!data) return null;

  const userId = await getUserId();
  return payloadToGroup(data as SessionPayload, userId);
}

async function handleRosterUpdated(payload: RosterUpdatedPayload): Promise<void> {
  if (payload.sessionId !== controlSessionId) return;

  try {
    const group = await refreshSession(payload.sessionId);
    if (!group) return;

    if (__DEV__) {
      console.log('[ReGroup] roster_updated:', group.members.length + 1, 'people');
    }

    rosterChangedHandler?.(group);
  } catch (error) {
    if (__DEV__) {
      console.warn('[ReGroup] roster refresh failed:', error);
    }
  }
}

async function broadcastRosterUpdated(sessionId: string): Promise<void> {
  const channel =
    controlChannel && controlSessionId === sessionId
      ? controlChannel
      : supabase.channel(sessionControlChannel(sessionId));

  const ephemeral = channel !== controlChannel;

  if (ephemeral) {
    await subscribeChannel(channel);
  }

  await channel.send({
    type: 'broadcast',
    event: ROSTER_UPDATED_EVENT,
    payload: { sessionId, timestamp: Date.now() } satisfies RosterUpdatedPayload,
  });

  if (ephemeral) {
    await supabase.removeChannel(channel);
  }
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

export async function leaveSessionPresence(): Promise<void> {
  presenceSessionId = null;
}

export async function leaveSessionChannel(): Promise<void> {
  await leaveSessionPresence();
  await leaveSessionLocations();

  if (!controlChannel) return;

  await supabase.removeChannel(controlChannel);
  controlChannel = null;
  controlSessionId = null;
}

/**
 * Subscribe to session control broadcasts (`session_ended`, `roster_updated`).
 */
export async function attachSessionControl(sessionId: string): Promise<void> {
  if (controlChannel && controlSessionId === sessionId) return;

  await leaveSessionChannel();

  const channel = supabase.channel(sessionControlChannel(sessionId));

  channel.on('broadcast', { event: SESSION_ENDED_EVENT }, ({ payload }) => {
    const ended = payload as SessionEndedPayload;
    deactivateSessionLocations();
    if (__DEV__) {
      console.log('[ReGroup] session_ended received:', ended);
    }
    sessionEndedHandler?.(ended);
  });

  channel.on('broadcast', { event: ROSTER_UPDATED_EVENT }, ({ payload }) => {
    void handleRosterUpdated(payload as RosterUpdatedPayload);
  });

  await subscribeChannel(channel);

  controlChannel = channel;
  controlSessionId = sessionId;
}

/**
 * Subscribe to roster sync on the session control channel (`roster_updated` broadcast).
 * Pattern A from phase-3: refetch roster on broadcast rather than separate presence channel.
 */
export async function attachSessionPresence(sessionId: string): Promise<void> {
  await attachSessionControl(sessionId);
  presenceSessionId = sessionId;
}

async function attachSessionRealtime(sessionId: string): Promise<void> {
  await attachSessionPresence(sessionId);
  await attachSessionLocations(sessionId);
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

  await attachSessionRealtime(group.id);

  return group;
}

export async function joinSession(inviteCode: string): Promise<Group> {
  await ensureSignedIn();
  await ensureUserProfile();

  const { data, error } = await supabase.rpc('join_session', {
    p_invite_code: inviteCode,
  });

  if (error) throw error;
  if (!data) throw new Error('join_session returned no data');

  const userId = await getUserId();
  const group = payloadToGroup(data as SessionPayload, userId);

  if (__DEV__) {
    console.log('[ReGroup] session joined:', group.id, group.inviteCode);
  }

  await attachSessionRealtime(group.id);
  await broadcastRosterUpdated(group.id);

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
  await attachSessionRealtime(group.id);

  return group;
}

export async function endSession(sessionId: string): Promise<void> {
  await ensureSignedIn();
  const userId = await getUserId();

  deactivateSessionLocations();

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
