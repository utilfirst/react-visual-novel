import { useLayoutEffect, useState } from "react";
import { useEventCallback } from "./use-event-callback.ts";

type PersistentStateOptions<T> = {
  key: string;
  initialValue: T;
  decode: (value: unknown) => T | null;
};

// NOTE: Native storage events reach other tabs. This event also synchronizes
// games mounted in the same document without changing persisted keys or JSON.
const storageEvent = "rvn:storage";

export function usePersistentState<T>(options: PersistentStateOptions<T>) {
  const [value, setValue] = useState(() => readPersistentState(options));

  const readValue = useEventCallback((stored: string | null): T =>
    decodePersistentState({ ...options, stored }),
  );

  const readStorage = useEventCallback(() => {
    try {
      setValue(readValue(window.localStorage.getItem(options.key)));
    } catch {
      // NOTE: A denied storage refresh must preserve in-memory state.
    }
  });

  const writeValue = useEventCallback((nextValue: T) => {
    writePersistentState({ key: options.key, value: nextValue });
    setValue(nextValue);
  });

  useLayoutEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        event.key === options.key
      ) {
        setValue(readValue(event.newValue));
      }
    };

    const handleLocalStorage = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === options.key) {
        readStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(storageEvent, handleLocalStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(storageEvent, handleLocalStorage);
    };
  }, [options.key, readValue, readStorage]);

  return [value, writeValue] as const;
}

export function readPersistentState<T>(options: PersistentStateOptions<T>): T {
  try {
    return decodePersistentState({
      ...options,
      stored: window.localStorage.getItem(options.key),
    });
  } catch {
    // NOTE: Games remain usable when browser storage is unavailable.
    return options.initialValue;
  }
}

type PersistentStateWriteOptions<T> = {
  key: string;
  value: T;
};

export function writePersistentState<T>(
  options: PersistentStateWriteOptions<T>,
) {
  try {
    window.localStorage.setItem(options.key, JSON.stringify(options.value));
    window.dispatchEvent(
      new CustomEvent(storageEvent, { detail: options.key }),
    );
  } catch {
    // NOTE: Persisting is optional when the browser denies storage access.
  }
}

type PersistentStateDecodeOptions<T> = PersistentStateOptions<T> & {
  stored: string | null;
};

function decodePersistentState<T>(options: PersistentStateDecodeOptions<T>): T {
  if (options.stored === null) {
    return options.initialValue;
  }

  try {
    return options.decode(JSON.parse(options.stored)) ?? options.initialValue;
  } catch {
    return options.initialValue;
  }
}
