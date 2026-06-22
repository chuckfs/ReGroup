import type { Friend, FriendStatus, Group, StatusTone } from '@/types';

/**
 * Ground-truth mock data + small helpers that operate on it. The whole
 * app reads from this module today; when the backend lands the strategy
 * is:
 *
 *   - Replace `mockGroup` with a hook (`useActiveGroup()`) that reads
 *     from the group store, which itself subscribes to the realtime
 *     channel.
 *   - Keep `STATUS_COPY`, `summarizeGroup`, `formatTimeAgo`,
 *     `formatDistance` as pure utilities — they don't change shape.
 *
 * Replace this whole module with realtime data when the backend lands —
 * the rest of the app only depends on these shapes.
 *
 * TODO(backend): wire `findFriendById` and `summarizeGroup` to read from
 * the Zustand group store + Supabase realtime channel.
 */

export const mockGroup: Group = {
  id: 'grp_brooklyn_nights',
  name: 'Brooklyn Nights',
  vibe: '7 people',
  user: {
    id: 'user_me',
    name: 'You',
    initials: 'YOU',
    batteryPercent: 92,
    status: 'with_group',
    // Position is driven by the GPS pipeline — not mock data.
  },
  members: [
    {
      id: 'f_jake',
      name: 'Jake',
      initials: 'JA',
      hue: 'electric',
      status: 'with_group',
      batteryPercent: 89,
      lastSeenMinutesAgo: 0,
      position: { x: 0.5, y: 0.5 },
      lastSeenPlace: 'House of Yes, Brooklyn',
      device: 'iPhone 15',
    },
    {
      id: 'f_maya',
      name: 'Maya',
      initials: 'MA',
      hue: 'magenta',
      status: 'with_group',
      batteryPercent: 78,
      lastSeenMinutesAgo: 0,
      position: { x: 0.5, y: 0.5 },
      lastSeenPlace: 'House of Yes, Brooklyn',
      device: 'iPhone 14 Pro',
    },
    {
      id: 'f_chris',
      name: 'Chris',
      initials: 'CH',
      hue: 'flame',
      status: 'with_group',
      batteryPercent: 62,
      lastSeenMinutesAgo: 0,
      position: { x: 0.5, y: 0.5 },
      lastSeenPlace: 'Wythe Ave, Brooklyn',
      device: 'iPhone 13',
    },
    {
      id: 'f_sophie',
      name: 'Sophie',
      initials: 'SO',
      hue: 'amber',
      status: 'with_group',
      batteryPercent: 85,
      lastSeenMinutesAgo: 0,
      position: { x: 0.5, y: 0.5 },
      lastSeenPlace: 'House of Yes, Brooklyn',
      device: 'iPhone 15 Pro',
    },
    {
      id: 'f_ben',
      name: 'Ben',
      initials: 'BE',
      hue: 'cyan',
      status: 'with_group',
      batteryPercent: 72,
      lastSeenMinutesAgo: 0,
      position: { x: 0.5, y: 0.5 },
      lastSeenPlace: 'Smorgasburg, Brooklyn',
      device: 'iPhone 14',
    },
    {
      id: 'f_alex',
      name: 'Alex',
      initials: 'AL',
      hue: 'mint',
      status: 'with_group',
      batteryPercent: 54,
      lastSeenMinutesAgo: 0,
      position: { x: 0.5, y: 0.5 },
      lastSeenPlace: 'Bedford Ave Station',
      device: 'iPhone 12',
    },
  ],
};

/** Human-readable label + accent colour key for a friend's status. */
export const STATUS_COPY: Record<
  FriendStatus,
  { label: string; tone: StatusTone }
> = {
  with_group: { label: 'With Group', tone: 'positive' },
  nearby: { label: 'Nearby', tone: 'neutral' },
  drifting: { label: 'Drifting', tone: 'warning' },
  separated: { label: 'Separated', tone: 'danger' },
  heading_home: { label: 'Heading Home', tone: 'neutral' },
  home_safe: { label: 'Home Safe', tone: 'positive' },
};

export function summarizeGroup(group: Group): {
  withGroup: number;
  drifting: number;
  total: number;
} {
  const total = group.members.length + 1;
  const withGroup =
    group.members.filter((f: Friend) => f.status === 'with_group').length + 1;
  const drifting = group.members.filter(
    (f: Friend) => f.status === 'drifting' || f.status === 'separated',
  ).length;
  return { withGroup, drifting, total };
}

export function findFriendById(id: string | undefined): Friend | undefined {
  if (!id) return undefined;
  return mockGroup.members.find((f) => f.id === id);
}

/** Pretty "x min ago" / "just now" formatter for a minutes-ago integer. */
export function formatTimeAgo(minutes: number): string {
  if (minutes <= 0) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hr ago';
  return `${hours} hr ago`;
}

/** Pretty distance formatter ("0.6 mi", "120 ft", "next to you"). */
export function formatDistance(miles: number | undefined): string {
  if (miles === undefined) return '—';
  if (miles < 0.02) return 'right here';
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft`;
  return `${miles.toFixed(1)} mi`;
}
