import * as Linking from 'expo-linking';

/** Uppercase invite code, no surrounding whitespace. */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Parse `regroup://join/BKLY-7G3X` (and query-suffixed variants) into an invite code.
 */
export function parseJoinDeepLink(url: string): string | null {
  if (!url) return null;

  const pathMatch = url.match(/\/join\/([^?#/]+)/i);
  if (pathMatch?.[1]) {
    const code = normalizeInviteCode(decodeURIComponent(pathMatch[1]));
    return code.length > 0 ? code : null;
  }

  try {
    const { hostname, path } = Linking.parse(url);
    if (hostname?.toLowerCase() === 'join' && path) {
      const segment = path.replace(/^\//, '').split('/')[0];
      if (segment) {
        const code = normalizeInviteCode(decodeURIComponent(segment));
        return code.length > 0 ? code : null;
      }
    }
  } catch {
    // fall through
  }

  return null;
}
