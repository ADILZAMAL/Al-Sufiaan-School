import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { makeStyles } from '../../theme';
import { initials } from '../../lib/rollNumber';

interface AvatarProps {
  firstName: string;
  lastName?: string | null;
  photo?: string | null;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ firstName, lastName, photo, size = 40 }) => {
  const styles = useStyles();
  const [failed, setFailed] = useState(false);
  const dims = { width: size, height: size, borderRadius: size / 2 };

  if (photo && !failed) {
    return <Image source={{ uri: photo }} style={[styles.image, dims]} onError={() => setFailed(true)} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.fallback, dims]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials({ firstName, lastName })}</Text>
    </View>
  );
};

const useStyles = makeStyles(({ colors }) => ({
  image: { backgroundColor: colors.border },
  fallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.primaryDark, fontWeight: '700' },
}));
