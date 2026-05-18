import { useCallback, useState } from 'react';

function read(storageKey) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(storageKey, value) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // localStorage may be disabled / full — silently ignore so the drill stays usable
  }
}

// Generic localStorage-backed stat store. `storageKey` is the top-level
// localStorage key (e.g. 'articleStats'); each record is keyed by a stable
// string and shaped however the caller wants — `seed(item)` returns the
// initial fields, `increment` then bumps `correct` or `incorrect`.
export function useLocalStorageStats(storageKey) {
  const [stats, setStats] = useState(() => read(storageKey));

  const record = useCallback((entryKey, seedFields, isCorrect) => {
    setStats(prev => {
      const existing = prev[entryKey] || { ...seedFields, correct: 0, incorrect: 0 };
      const next = {
        ...prev,
        [entryKey]: {
          ...existing,
          correct: existing.correct + (isCorrect ? 1 : 0),
          incorrect: existing.incorrect + (isCorrect ? 0 : 1),
        },
      };
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const reset = useCallback(() => {
    write(storageKey, {});
    setStats({});
  }, [storageKey]);

  return { stats, record, reset };
}
