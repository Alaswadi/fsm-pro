import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Theme } from '@/constants/Theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'heading' ? styles.heading : undefined,
        type === 'subheading' ? styles.subheading : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: Theme.typography.fontSizes.base,
    lineHeight: Theme.typography.lineHeights.base,
    color: Theme.colors.text.primary,
  },
  title: {
    fontSize: Theme.typography.fontSizes['2xl'],
    lineHeight: Theme.typography.lineHeights['2xl'],
    fontWeight: Theme.typography.fontWeights.semibold,
    color: Theme.colors.text.primary,
  },
  heading: {
    fontSize: Theme.typography.fontSizes.lg,
    lineHeight: Theme.typography.lineHeights.lg,
    fontWeight: Theme.typography.fontWeights.semibold,
    color: Theme.colors.text.primary,
  },
  subheading: {
    fontSize: Theme.typography.fontSizes.base,
    lineHeight: Theme.typography.lineHeights.base,
    fontWeight: Theme.typography.fontWeights.medium,
    color: Theme.colors.text.primary,
  },
  body: {
    fontSize: Theme.typography.fontSizes.sm,
    lineHeight: Theme.typography.lineHeights.sm,
    color: Theme.colors.text.secondary,
  },
  caption: {
    fontSize: Theme.typography.fontSizes.xs,
    lineHeight: Theme.typography.lineHeights.xs,
    color: Theme.colors.text.tertiary,
  },
  link: {
    fontSize: Theme.typography.fontSizes.base,
    lineHeight: Theme.typography.lineHeights.base,
    color: Theme.colors.primary.DEFAULT,
  },
});
