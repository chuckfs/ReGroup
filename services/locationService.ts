import * as Location from 'expo-location';

import type { DeviceLocation } from '@/types/location';

type LocationListener = (location: DeviceLocation) => void;

function toDeviceLocation(position: Location.LocationObject): DeviceLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

class LocationServiceImpl {
  private listeners = new Set<LocationListener>();
  private subscription: Location.LocationSubscription | null = null;

  async requestForegroundPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  }

  async getForegroundPermissionStatus(): Promise<Location.PermissionStatus> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  }

  subscribe(listener: LocationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async startWatching(): Promise<void> {
    if (this.subscription) return;

    // TODO(realtime): broadcast each fix to the Supabase realtime channel
    // keyed by (groupId, userId) so other members see the user's position.
    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 5,
        timeInterval: 3000,
      },
      (position) => {
        const update = toDeviceLocation(position);
        this.listeners.forEach((listener) => listener(update));
      },
    );
  }

  stopWatching(): void {
    this.subscription?.remove();
    this.subscription = null;
  }
}

export const locationService = new LocationServiceImpl();
