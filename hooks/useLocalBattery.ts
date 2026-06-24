import { useEffect, useState } from 'react';

import { getBatteryPercent } from '@/services/batteryService';

/**
 * Local device battery for the self row in an active session.
 * Refreshes on mount and every 60 s.
 */
export function useLocalBattery(enabled = true, pollMs = 60_000): number | null {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPercent(null);
      return;
    }

    let active = true;

    const refresh = async () => {
      const next = await getBatteryPercent();
      if (active) setPercent(next);
    };

    void refresh();
    const intervalId = setInterval(() => {
      void refresh();
    }, pollMs);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [enabled, pollMs]);

  return percent;
}
