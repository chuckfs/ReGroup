import { calculateDistanceMeters } from '@/services/distance';
import type {
  DeviceLocation,
  GeoCoordinate,
  MapPosition,
} from '@/types/location';

const EARTH_RADIUS_METERS = 6_371_000;

export const MAP_SPAN_LIMITS = {
  MIN_METERS: 1_500,
  MAX_METERS: 5_000,
  PADDING_FACTOR: 1.4,
} as const;

/**
 * GPS → stylised map projection with adaptive span for festival-scale crews.
 *
 * TODO(Phase 4+): cluster nearby pins when groups grow large.
 * TODO(venue): bias origin or span using venue metadata.
 */
export type MapProjectionConfig = {
  /**
   * Meters represented across the full normalized span (0 → 1).
   * Tuned for a single night-out area — not geographically exact.
   */
  spanMeters: number;
};

const DEFAULT_CONFIG: MapProjectionConfig = {
  spanMeters: MAP_SPAN_LIMITS.MIN_METERS,
};

type SpanListener = () => void;

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Fit map span to the farthest fix from the session origin.
 * `spanMeters` is the full normalized width — use diameter × padding.
 */
export function computeAdaptiveSpanMeters(
  origin: GeoCoordinate,
  locations: GeoCoordinate[],
): number {
  if (locations.length === 0) return MAP_SPAN_LIMITS.MIN_METERS;

  let maxMeters = 0;
  for (const location of locations) {
    maxMeters = Math.max(maxMeters, calculateDistanceMeters(origin, location));
  }

  const diameter = maxMeters * 2;
  return Math.min(
    MAP_SPAN_LIMITS.MAX_METERS,
    Math.max(
      MAP_SPAN_LIMITS.MIN_METERS,
      diameter * MAP_SPAN_LIMITS.PADDING_FACTOR,
    ),
  );
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
  private spanListeners = new Set<SpanListener>();

  constructor(config: MapProjectionConfig = DEFAULT_CONFIG) {
    this.config = { ...config };
  }

  getSpanMeters(): number {
    return this.config.spanMeters;
  }

  setSpanMeters(spanMeters: number): void {
    const next = Math.min(
      MAP_SPAN_LIMITS.MAX_METERS,
      Math.max(MAP_SPAN_LIMITS.MIN_METERS, spanMeters),
    );

    if (this.config.spanMeters === next) return;

    this.config.spanMeters = next;
    this.spanListeners.forEach((listener) => listener());
  }

  subscribeSpan(listener: SpanListener): () => void {
    this.spanListeners.add(listener);
    return () => {
      this.spanListeners.delete(listener);
    };
  }

  /**
   * Auto-fit span from the user + crew GPS fixes relative to the map origin.
   */
  updateSpanForLocations(
    userLocation: DeviceLocation,
    friendLocations: Record<string, DeviceLocation>,
  ): void {
    if (!this.origin) return;

    const coordinates: GeoCoordinate[] = [
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      },
      ...Object.values(friendLocations).map((location) => ({
        latitude: location.latitude,
        longitude: location.longitude,
      })),
    ];

    this.setSpanMeters(computeAdaptiveSpanMeters(this.origin, coordinates));
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
    this.setSpanMeters(DEFAULT_CONFIG.spanMeters);
  }
}

export const mapProjection = new MapProjectionImpl();
