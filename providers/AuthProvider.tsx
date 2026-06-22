import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette, spacing } from '@/constants';
import { isSimulatorStorageError } from '@/lib/authStorage';
import { ensureSignedIn } from '@/services/authService';
import { useGroupStore } from '@/store/useGroupStore';

type Props = {
  children: React.ReactNode;
};

/**
 * Invisible auth gate — anonymous sign-in + profile upsert before routes mount.
 * Boot: anonymous sign-in, profile upsert, then restore active session.
 */
export function AuthProvider({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    ensureSignedIn()
      .then(() => useGroupStore.getState().restoreActiveSession())
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Auth failed');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    const storageHint = isSimulatorStorageError(error)
      ? '\n\nSimulator fix: delete Expo Go from the simulator (long-press → Remove App), then run npx expo start -c and reopen.'
      : '';

    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not connect</Text>
        <Text style={styles.errorBody}>{error + storageHint}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.lilac} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.voidPurple,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: {
    color: palette.lilac,
    fontWeight: '600',
  },
  errorBody: {
    color: palette.whisper,
    textAlign: 'center',
  },
});
