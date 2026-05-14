import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { IconGlyph, PressableScale } from '@/components/ui';
import { palette, radius, shadow } from '@/constants';

type Props = {
  onPress?: () => void;
};

/**
 * Glowing "centre map on me" FAB. Sits in the bottom-right above the
 * sheet's peek state.
 */
export function LocateFab({ onPress }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Center map on me"
      style={styles.shadowWrap}
    >
      <View style={styles.outer}>
        <LinearGradient
          colors={[palette.electric, palette.magenta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <IconGlyph name="locate" size={22} color={palette.moonlight} />
      </View>
    </PressableScale>
  );
}

const SIZE = 54;

const styles = StyleSheet.create({
  shadowWrap: {
    ...shadow.fab,
    shadowColor: palette.electric,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    borderRadius: radius.pill,
  },
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
