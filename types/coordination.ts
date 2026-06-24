import type { DeviceLocation } from './location';
import type { CoordinationStatus } from './status';

/** Ephemeral rally point broadcast on `session:{sessionId}:coordination`. */
export type RallyPoint = {
  sessionId: string;
  rallyId: string;
  initiatorUserId: string;
  initiatorName: string;
  location: DeviceLocation;
  createdAt: number;
  label?: string;
};

export type RallyStartedPayload = {
  rally: RallyPoint;
};

export type RallyCancelledPayload = {
  sessionId: string;
  rallyId: string;
};

/** Member response to an active rally (Stream 3). */
export type CoordinationUpdate = {
  sessionId: string;
  rallyId: string;
  userId: string;
  status: Exclude<CoordinationStatus, 'no_response'>;
  timestamp: number;
};
