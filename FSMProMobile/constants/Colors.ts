/**
 * Color system matching the mobdesign HTML files
 * Primary: #3B82F6 (Blue)
 * Uses the centralized Theme configuration
 */

import { Theme } from './Theme';

const tintColorLight = Theme.colors.primary.DEFAULT;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: Theme.colors.text.primary,
    background: Theme.colors.background.primary,
    tint: tintColorLight,
    icon: Theme.colors.gray[600],
    tabIconDefault: Theme.colors.gray[400],
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
