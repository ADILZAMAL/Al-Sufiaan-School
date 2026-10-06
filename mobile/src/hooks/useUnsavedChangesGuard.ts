import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Asks before leaving a screen with unsaved changes (back button, swipe,
 * Android hardware back). `onDiscard` runs when the user chooses to leave,
 * e.g. to drop an autosaved draft.
 */
export const useUnsavedChangesGuard = (
  hasUnsavedChanges: boolean,
  { message = 'You have unsaved changes. Leave without saving?', onDiscard }: { message?: string; onDiscard?: () => void } = {}
) => {
  const navigation = useNavigation();
  const onDiscardRef = useRef(onDiscard);
  onDiscardRef.current = onDiscard;

  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        if (!hasUnsavedChanges) return;
        e.preventDefault();
        Alert.alert('Discard changes?', message, [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              onDiscardRef.current?.();
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      }),
    [navigation, hasUnsavedChanges, message]
  );
};
