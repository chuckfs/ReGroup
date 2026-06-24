import * as Battery from 'expo-battery';

const CACHE_MS = 60_000;

let cachedPercent: number | null = null;
let cachedAt = 0;

/**
 * Device battery level (0–100). Cached for 60 s to avoid hammering the API.
 */
export async function getBatteryPercent(): Promise<number> {
  const now = Date.now();
  if (cachedPercent != null && now - cachedAt < CACHE_MS) {
    return cachedPercent;
  }

  try {
    const level = await Battery.getBatteryLevelAsync();
    const percent = Math.round(Math.min(1, Math.max(0, level)) * 100);
    cachedPercent = percent;
    cachedAt = now;
    return percent;
  } catch {
    return cachedPercent ?? 100;
  }
}

export function resetBatteryCache(): void {
  cachedPercent = null;
  cachedAt = 0;
}
