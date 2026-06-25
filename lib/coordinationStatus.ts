import type { RallyPoint } from '@/types/coordination';
import type { CoordinationStatus } from '@/types/status';

export const RESPONSE_TIMEOUT_MS = 90_000;

type ResponseMap = Record<
  string,
  Exclude<CoordinationStatus, 'no_response'>
>;

export function resolveCoordinationStatus(
  userId: string,
  ctx: {
    activeRally: RallyPoint | null;
    responses: ResponseMap;
    responseDeadline: number | null;
    currentUserId: string;
    rosterUserIds: string[];
  },
  now = Date.now(),
): CoordinationStatus | undefined {
  const { activeRally, responses, responseDeadline, currentUserId, rosterUserIds } =
    ctx;

  if (!activeRally) return undefined;

  const response = responses[userId];
  if (response) return response;

  const isInitiator = activeRally.initiatorUserId === currentUserId;
  if (!isInitiator) return undefined;
  if (!responseDeadline || now < responseDeadline) return undefined;
  if (userId === currentUserId) return undefined;
  if (!rosterUserIds.includes(userId)) return undefined;

  return 'no_response';
}
