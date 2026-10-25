import React from 'react';
import { RefreshControl, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (use FlatList screens with `scroll={false}`). */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  /** Pinned below the scroll area, e.g. a save bar. */
  footer?: React.ReactNode;
}

export const Screen: React.FC<ScreenProps> = ({ children, scroll = true, refreshing = false, onRefresh, contentStyle, footer }) => {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
      {footer}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
}));
