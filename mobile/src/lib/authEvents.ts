type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Lets the API client (outside React) tell AuthContext that the session is no
 * longer valid, so every 401 logs the user out in one place.
 */
export const authEvents = {
  onUnauthorized(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emitUnauthorized() {
    listeners.forEach(listener => listener());
  },
};
