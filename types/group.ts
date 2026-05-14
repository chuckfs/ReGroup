import type { MarkerHue } from '@/constants';
import type { CurrentUser, Friend } from './friend';

/**
 * The "kind of night" a group is for. Drives accent colour, copy, and
 * later (separation thresholds, end-time defaults, etc).
 */
export type GroupVibeKey =
  | 'nightlife'
  | 'concert'
  | 'bar_crawl'
  | 'club_night'
  | 'festival'
  | 'birthday'
  | 'house_party'
  | 'city_walk';

export type GroupVibe = {
  key: GroupVibeKey;
  label: string;
  emoji: string;
  accent: MarkerHue;
  blurb: string;
};

export type Group = {
  id: string;
  name: string;
  /** Short human label (e.g. "7 people"), shown in the top-bar pill. */
  vibe: string;
  /** Structured vibe (emoji/accent/etc.), set when a group is created. */
  vibeKey?: GroupVibeKey;
  /** Shareable join code, e.g. "BKLY-7G3X". */
  inviteCode?: string;
  members: Friend[];
  user: CurrentUser;
};

/** Draft produced by the group-creation wizard, before persistence. */
export type DraftGroup = {
  name: string;
  vibeKey: GroupVibeKey;
  inviteCode: string;
};

/**
 * Quick actions on the bottom sheet. Adding a new one here flows through
 * to the QuickActions component and the on-press handler in HomeScreen.
 */
export type QuickAction = 'im_good' | 'heading_home' | 'end_night';
