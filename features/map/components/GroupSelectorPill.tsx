import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard, IconGlyph, PressableScale } from '@/components/ui';
import { palette, radius, typography } from '@/constants';

type Props = {
  groupName: string;
  rosterLabel: string;
  onPress?: () => void;
};

/** The centred "Brooklyn Nights · 7 people" pill in the floating top bar. */
export function GroupSelectorPill({ groupName, rosterLabel, onPress }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${groupName}, ${rosterLabel}. Tap to switch group.`}
    >
      <GlassCard
        cornerRadius={radius.pill}
        variant="strong"
        style={styles.pill}
      >
        <View style={styles.row}>
          <View>
            <Text style={styles.groupName}>{groupName}</Text>
            <Text style={styles.subtitle}>{rosterLabel}</Text>
          </View>
          <IconGlyph
            name="arrow"
            size={20}
            color={palette.lilac}
            style={styles.chevron}
          />
        </View>
      </GlassCard>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupName: {
    ...typography.titleMedium,
    color: palette.moonlight,
  },
  subtitle: {
    ...typography.caption,
    color: palette.lilac,
    marginTop: 1,
  },
  chevron: {
    transform: [{ rotate: '90deg' }],
    marginLeft: 2,
  },
});
