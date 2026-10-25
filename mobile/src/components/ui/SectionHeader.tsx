import React from 'react';
import { Text, View } from 'react-native';
import { makeStyles } from '../../theme';

export const SectionHeader: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -spacing.xs },
  title: { ...typography.small, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textMuted },
}));
