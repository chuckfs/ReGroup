import { Linking, Platform } from 'react-native';

import type { GeoCoordinate } from '@/types/location';

/** Open the rally point in Apple Maps, Google Maps, or the web fallback. */
export function openRallyInMaps(location: GeoCoordinate, label = 'Regroup'): void {
  const { latitude, longitude } = location;
  const encodedLabel = encodeURIComponent(label);

  const url = Platform.select({
    ios: `maps://?daddr=${latitude},${longitude}&q=${encodedLabel}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://maps.google.com/?q=${latitude},${longitude}`,
  });

  if (!url) return;
  void Linking.openURL(url);
}
