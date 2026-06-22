import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/buttons';
import { spacing } from '@/constants';

import { GroupSelectorPill } from './GroupSelectorPill';

type Props = {
  groupName: string;
  /** e.g. "7 people" or "1 person" from the active group. */
  rosterLabel: string;
  onMenu?: () => void;
  onChat?: () => void;
  onSwitchGroup?: () => void;
};

/**
 * The floating top bar overlaid on the map: menu (left), group selector
 * pill (centre), chat (right). Honours the safe-area inset so the notch /
 * Dynamic Island never collides with it.
 */
export function TopBar({
  groupName,
  rosterLabel,
  onMenu,
  onChat,
  onSwitchGroup,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}
    >
      <IconButton
        icon="menu"
        onPress={onMenu}
        accessibilityLabel="Open menu"
      />
      <GroupSelectorPill
        groupName={groupName}
        rosterLabel={rosterLabel}
        onPress={onSwitchGroup}
      />
      <IconButton
        icon="chat"
        onPress={onChat}
        accessibilityLabel="Open group chat"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
});
