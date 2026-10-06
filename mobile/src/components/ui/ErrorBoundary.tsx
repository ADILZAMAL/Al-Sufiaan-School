import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { lightColors } from '../../theme';

interface State {
  error: Error | null;
}

/** Last line of defence: a render crash shows a recoverable screen instead of a white app. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>The screen hit an unexpected error. Your saved data is safe.</Text>
        <Pressable
          style={styles.button}
          onPress={() => this.setState({ error: null })}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: lightColors.background },
  title: { fontSize: 18, fontWeight: '700', color: lightColors.text },
  message: { fontSize: 15, color: lightColors.textMuted, textAlign: 'center', marginTop: 8 },
  button: { marginTop: 20, backgroundColor: lightColors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: lightColors.onPrimary, fontWeight: '600', fontSize: 15 },
});
