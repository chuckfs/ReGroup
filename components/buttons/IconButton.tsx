import React from 'react';
import { StyleSheet, View } from 'react-native';

import { palette, radius } from '@/constants';
import { GlassCard, IconGlyph, PressableScale } from '@/components/ui';
import type { IconName } from '@/components/ui';

type Props = {
  icon: IconName;
  size?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  tint?: string;
};

/** Circular glass button used in the floating top bar. */
export function IconButton({
  icon,
  size = 48,
  onPress,
  accessibilityLabel,
  tint = palette.moonlight,
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
    >
      <GlassCard
        cornerRadius={radius.pill}
        style={[styles.btn, { width: size, height: size }]}
      >
        <View style={styles.center}>
          <IconGlyph name={icon} size={Math.round(size * 0.45)} color={tint} />
        </View>
      </GlassCard>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
