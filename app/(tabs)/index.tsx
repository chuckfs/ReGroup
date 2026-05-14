import React from 'react';

import { HomeScreen } from '@/features/map';

/**
 * Primary map tab. The actual screen lives in `@/features/map` so this
 * file stays a thin Expo Router shim — that's how every route in this
 * app is structured: route ↔ screen factory.
 */
export default function HomeRoute() {
  return <HomeScreen />;
}
