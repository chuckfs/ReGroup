import React from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants';

/**
 * The little grabber bar at the top of a bottom sheet.
 *
 * Generic on purpose — used by `GroupSheet` today and by any future
 * sheet (alerts, chat thread, friend detail-as-sheet). Sizing/colour
 * are fixed; if a feature ever needs to retint it for emphasis we'll
 * add props at that point.
 */
export function BottomSheetHandle() {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  bar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.faint,
  },
});
