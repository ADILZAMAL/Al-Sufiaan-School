import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

/** Short, non-blocking confirmations (use Alert only for decisions). */
export const toast = {
  success(message: string, detail?: string) {
    Toast.show({ type: 'success', text1: message, text2: detail });
  },
  error(message: string, detail?: string) {
    Toast.show({ type: 'error', text1: message, text2: detail, visibilityTime: 5000 });
  },
  info(message: string, detail?: string) {
    Toast.show({ type: 'info', text1: message, text2: detail });
  },
};

// Haptics are best-effort; ignore devices without a taptic engine.
export const haptics = {
  tap() {
    Haptics.selectionAsync().catch(() => {});
  },
  success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  error() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
