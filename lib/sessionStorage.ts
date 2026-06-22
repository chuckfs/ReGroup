import { authStorage } from '@/lib/authStorage';

const ACTIVE_SESSION_KEY = 'regroup:activeSessionId';

export async function readActiveSessionId(): Promise<string | null> {
  return authStorage.getItem(ACTIVE_SESSION_KEY);
}

export async function persistActiveSessionId(sessionId: string): Promise<void> {
  await authStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

export async function clearActiveSessionId(): Promise<void> {
  await authStorage.removeItem(ACTIVE_SESSION_KEY);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRealSessionId(sessionId: string): boolean {
  return UUID_RE.test(sessionId);
}
