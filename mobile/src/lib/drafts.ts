import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Unsaved work (attendance being marked, marks being typed) is autosaved here
 * so it survives the app being killed or the network dropping mid-save.
 */
const PREFIX = 'draft:v1:';
const MAX_AGE_MS = 8 * 24 * 60 * 60 * 1000;

export interface Draft<T> {
  savedAt: number;
  data: T;
}

export const drafts = {
  async load<T>(key: string): Promise<Draft<T> | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as Draft<T>) : null;
    } catch {
      return null;
    }
  },

  async save<T>(key: string, data: T): Promise<void> {
    const draft: Draft<T> = { savedAt: Date.now(), data };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(draft)).catch(() => {});
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(PREFIX + key).catch(() => {});
  },
};

const draftKeys = async () => (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(PREFIX));

export const clearAllDrafts = async () => {
  await AsyncStorage.multiRemove(await draftKeys());
};

/** Drops drafts older than 8 days (past the attendance edit window). */
export const purgeOldDrafts = async () => {
  try {
    const entries = await AsyncStorage.multiGet(await draftKeys());
    const stale = entries
      .filter(([, raw]) => {
        try {
          return !raw || Date.now() - (JSON.parse(raw) as Draft<unknown>).savedAt > MAX_AGE_MS;
        } catch {
          return true;
        }
      })
      .map(([key]) => key);
    if (stale.length) await AsyncStorage.multiRemove(stale);
  } catch {
    // best-effort cleanup
  }
};
