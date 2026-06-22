import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase auth storage with an in-memory fallback when the iOS Simulator
 * AsyncStorage path is corrupted (ExponentExperienceData/@anonymous).
 */
const memoryStore = new Map<string, string>();
let useMemoryFallback = false;

async function getItem(key: string): Promise<string | null> {
  if (useMemoryFallback) {
    return memoryStore.get(key) ?? null;
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    useMemoryFallback = true;
    if (__DEV__) {
      console.warn(
        '[ReGroup] AsyncStorage unavailable — using in-memory auth storage for this session.',
        error,
      );
    }
    return memoryStore.get(key) ?? null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (useMemoryFallback) {
    memoryStore.set(key, value);
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    useMemoryFallback = true;
    memoryStore.set(key, value);
    if (__DEV__) {
      console.warn(
        '[ReGroup] AsyncStorage unavailable — using in-memory auth storage for this session.',
        error,
      );
    }
  }
}

async function removeItem(key: string): Promise<void> {
  memoryStore.delete(key);

  if (useMemoryFallback) return;

  try {
    await AsyncStorage.removeItem(key);
  } catch {
    useMemoryFallback = true;
  }
}

export const authStorage = {
  getItem,
  setItem,
  removeItem,
};

export function isAuthStorageMemoryFallback(): boolean {
  return useMemoryFallback;
}

export function isSimulatorStorageError(message: string): boolean {
  return (
    message.includes('Failed to create storage directory') ||
    message.includes('ExponentExperienceData') ||
    message.includes('Not a directory')
  );
}
