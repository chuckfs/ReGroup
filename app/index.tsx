import React, { useCallback } from 'react';
import { router } from 'expo-router';

import { SplashScreen } from '@/features/onboarding';

/**
 * Splash route. When the splash animation settles it navigates into the
 * (tabs) group via `router.replace` so users can't swipe back to it.
 *
 * The `/(tabs)` path is typed once Expo Router regenerates its types
 * after the first `expo start`; until then we keep the string literal.
 */
export default function SplashRoute() {
  const handleReady = useCallback(() => {
    router.replace('/(tabs)' as never);
  }, []);

  return <SplashScreen onReady={handleReady} />;
}
