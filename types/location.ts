/**
 * Location domain types — device fixes and stylized map coordinates.
 * Kept separate from friend/group types so the location pipeline can
 * evolve without dragging social graph shapes along.
 */

export interface MapPosition {
  x: number;
  y: number;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}
