import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  displayName: string;
  initials: string;
  createdAt: string;
};

type UserRow = {
  id: string;
  display_name: string;
  initials: string;
  created_at: string;
};

let bootPromise: Promise<UserProfile> | null = null;

function toUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    initials: row.initials,
    createdAt: row.created_at,
  };
}

async function bootAuth(): Promise<UserProfile> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error('Anonymous sign-in failed');
  }

  return ensureUserProfile();
}

/**
 * Idempotent boot: restore or create an anonymous session, then ensure a
 * `public.users` profile row exists. Safe to call from app launch.
 */
export async function ensureSignedIn(): Promise<UserProfile> {
  if (!bootPromise) {
    bootPromise = bootAuth().catch((error) => {
      bootPromise = null;
      throw error;
    });
  }

  return bootPromise;
}

export async function getUserId(): Promise<string> {
  const profile = await ensureSignedIn();
  return profile.id;
}

/**
 * Upsert the caller's profile via `ensure_user_profile` RPC (Stream 1).
 */
export async function ensureUserProfile(
  displayName = 'You',
  initials = 'YOU',
): Promise<UserProfile> {
  const { data, error } = await supabase.rpc('ensure_user_profile', {
    p_display_name: displayName,
    p_initials: initials,
  });

  if (error) throw error;
  if (!data) throw new Error('ensure_user_profile returned no data');

  const profile = toUserProfile(data as UserRow);

  if (__DEV__) {
    console.log('[ReGroup] auth ready:', profile.id);
  }

  return profile;
}
