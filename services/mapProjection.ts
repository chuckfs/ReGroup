import { calculateDistanceMeters } from '@/services/distance';
import type {
  DeviceLocation,
  GeoCoordinate,
  MapPosition,
} from '@/types/location';

const EARTH_RADIUS_METERS = 6_371_000;

export type MapProjectionConfig = {
  /**
   * Meters represented across the full normalized span (0 → 1).
   * Tuned for a single night-out area — not geographically exact.
   */
  spanMeters: number;
};

const DEFAULT_CONFIG: MapProjectionConfig = {
  spanMeters: 1_500,
};

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Convert a GPS offset from an origin into stylized map space.
 * Y increases downward on screen; north is negative Y.
 */
function offsetMetersToMapPosition(
  origin: GeoCoordinate,
  location: GeoCoordinate,
  config: MapProjectionConfig,
): MapPosition {
  const latMid = (origin.latitude + location.latitude) / 2;
  const dLat = location.latitude - origin.latitude;
  const dLng = location.longitude - origin.longitude;

  const northMeters = dLat * (Math.PI / 180) * EARTH_RADIUS_METERS;
  const eastMeters =
    dLng *
    (Math.PI / 180) *
    EARTH_RADIUS_METERS *
    Math.cos((latMid * Math.PI) / 180);

  return {
    x: clamp01(0.5 + eastMeters / config.spanMeters),
    y: clamp01(0.5 - northMeters / config.spanMeters),
  };
}

/**
 * Shift a map position so the user stays at the optical centre while
 * the rest of the crew moves relative to them.
 */
export function relativeToUser(
  position: MapPosition,
  userPosition: MapPosition,
): MapPosition {
  return {
    x: position.x - userPosition.x + 0.5,
    y: position.y - userPosition.y + 0.5,
  };
}

class MapProjectionImpl {
  private origin: GeoCoordinate | null = null;
  private config: MapProjectionConfig;

  constructor(config: MapProjectionConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Project a device fix into normalised map space.
   * The first fix anchors the user at (0.5, 0.5); later fixes drift
   * relative to that origin.
   */
  project(location: DeviceLocation): MapPosition {
    const coordinate: GeoCoordinate = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    if (!this.origin) {
      this.origin = coordinate;
      return { x: 0.5, y: 0.5 };
    }

    return offsetMetersToMapPosition(this.origin, coordinate, this.config);
  }

  /**
   * Project a coordinate using the established origin without resetting
   * it. Used for friend positions once the user's first fix has set the
   * map anchor.
   */
  projectFromOrigin(location: DeviceLocation): MapPosition | null {
    if (!this.origin) return null;

    return offsetMetersToMapPosition(
      this.origin,
      {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      this.config,
    );
  }

  getOrigin(): GeoCoordinate | null {
    return this.origin;
  }

  reset(): void {
    this.origin = null;
  }

  /**
   * TODO(realtime): project a friend's Supabase realtime location
   * relative to the active group centroid instead of the user origin.
   */
  projectFriendRelativeToGroup(
    friendLocation: GeoCoordinate,
    groupCentroid: GeoCoordinate,
  ): MapPosition {
    const distanceMeters = calculateDistanceMeters(groupCentroid, friendLocation);
    // Placeholder — real implementation will use bearing + distance.
    void distanceMeters;
    return offsetMetersToMapPosition(groupCentroid, friendLocation, this.config);
  }

  /**
   * TODO(clustering): merge nearby projected positions into a single
   * cluster marker when friends are within a tight radius.
   */
  clusterPositions(_positions: MapPosition[]): MapPosition[] {
    return _positions;
  }

  /**
   * TODO(venue): bias projection origin or span using venue metadata
   * (concert hall, festival grounds, bar crawl route).
   */
  setVenueContext(_venueId: string | null): void {
    // No-op until venue awareness lands.
  }
}

export const mapProjection = new MapProjectionImpl();
