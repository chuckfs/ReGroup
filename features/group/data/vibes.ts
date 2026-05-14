import type { GroupVibe, GroupVibeKey } from '@/types';

/**
 * The vibes a user can pick when creating a group. Each one has an emoji
 * for the picker, an accent hue (drives the user marker + group accents),
 * and a short blurb shown beneath the selection.
 *
 * Lives inside the group feature module because vibes are conceptually
 * group-only — keeping them here lets the wizard own its own data.
 *
 * TODO(backend): once vibes ship with server-side analytics or A/B
 * weighting, this list becomes a fetched config; the shape doesn't
 * change.
 */
export const VIBES: GroupVibe[] = [
  {
    key: 'nightlife',
    label: 'Nightlife',
    emoji: '🌃',
    accent: 'magenta',
    blurb: 'Out on the town, multiple stops.',
  },
  {
    key: 'concert',
    label: 'Concert',
    emoji: '🎵',
    accent: 'electric',
    blurb: 'One venue, easy to lose people in the crowd.',
  },
  {
    key: 'bar_crawl',
    label: 'Bar Crawl',
    emoji: '🍻',
    accent: 'amber',
    blurb: 'Hopping between spots in a neighbourhood.',
  },
  {
    key: 'club_night',
    label: 'Club Night',
    emoji: '🪩',
    accent: 'flame',
    blurb: 'One club, big crowd, late hours.',
  },
  {
    key: 'festival',
    label: 'Festival',
    emoji: '🎪',
    accent: 'cyan',
    blurb: 'Big footprint, plan meet-up spots.',
  },
  {
    key: 'birthday',
    label: 'Birthday',
    emoji: '🎂',
    accent: 'rose',
    blurb: 'Celebrating a friend, keep everyone in.',
  },
  {
    key: 'house_party',
    label: 'House Party',
    emoji: '🏠',
    accent: 'lilac',
    blurb: "Indoors, but still keep tabs on who's where.",
  },
  {
    key: 'city_walk',
    label: 'City Walk',
    emoji: '🌆',
    accent: 'mint',
    blurb: 'Exploring without a fixed plan.',
  },
];

export const VIBES_BY_KEY: Record<GroupVibeKey, GroupVibe> = VIBES.reduce(
  (acc, v) => {
    acc[v.key] = v;
    return acc;
  },
  {} as Record<GroupVibeKey, GroupVibe>,
);

/**
 * Generate a memorable invite code from a group name. Same algorithm as
 * "GroupMe"-style codes: alpha prefix from the name, dash, 4-char random.
 *
 * Example: "Brooklyn Nights" → "BKLY-7G3X"
 *
 * TODO(backend): the server should be the authority on invite codes
 * (collision-free, revocable, expiring). This helper stays as a
 * client-side "preview" for the wizard.
 */
export function generateInviteCode(groupName: string): string {
  const cleaned = groupName.replace(/[^A-Za-z]/g, '').toUpperCase();
  const prefix = cleaned.length >= 4 ? cleaned.slice(0, 4) : (cleaned + 'NITE').slice(0, 4);
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += charset[Math.floor(Math.random() * charset.length)];
  }
  return `${prefix}-${suffix}`;
}
