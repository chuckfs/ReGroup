import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { locationService } from '@/services/locationService';
import type { DeviceLocation } from '@/types/location';

type UseLocationResult = {
  location: DeviceLocation | null;
  permission: Location.PermissionStatus | 'idle';
  error: string | null;
};

/**
 * Request foreground location permission and subscribe to the latest
 * device fix. Holds only the most recent point in memory — no history.
 */
export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [permission, setPermission] = useState<
    Location.PermissionStatus | 'idle'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const granted = await locationService.requestForegroundPermission();
        if (!active) return;

        setPermission(
          granted
            ? Location.PermissionStatus.GRANTED
            : await locationService.getForegroundPermissionStatus(),
        );

        if (!granted) {
          setError('Location permission denied');
          return;
        }

        unsubscribe = locationService.subscribe((next) => {
          if (active) setLocation(next);
        });

        await locationService.startWatching();
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Failed to get location',
          );
        }
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
      locationService.stopWatching();
    };
  }, []);

  return { location, permission, error };
}
