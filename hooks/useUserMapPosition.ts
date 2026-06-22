import { useMemo } from 'react';

import { useLocation } from '@/hooks/useLocation';
import { mapProjection } from '@/services/mapProjection';
import type { DeviceLocation, MapPosition } from '@/types/location';

const DEFAULT_POSITION: MapPosition = { x: 0.5, y: 0.5 };

type UseUserMapPositionResult = {
  location: DeviceLocation | null;
  mapPosition: MapPosition;
  permission: ReturnType<typeof useLocation>['permission'];
  error: string | null;
};

/**
 * Compose `useLocation` with the map projection layer. The user's
 * normalised position updates as GPS fixes arrive; the map canvas keeps
 * the marker visually centred via `relativeToUser`.
 */
export function useUserMapPosition(): UseUserMapPositionResult {
  const { location, permission, error } = useLocation();

  const mapPosition = useMemo(() => {
    if (!location) return DEFAULT_POSITION;
    return mapProjection.project(location);
  }, [location]);

  return { location, mapPosition, permission, error };
}
