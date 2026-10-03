import React from "react";
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
  const readValue = useEventCallback((stored: string | null): T => {
    if (stored === null) {
      return options.initialValue;
    }

    try {
      return options.decode(JSON.parse(stored)) ?? options.initialValue;
    } catch {
      return options.initialValue;
    }
  });

  const [value, setValue] = React.useState(() => {
    try {
      return readValue(window.localStorage.getItem(options.key));
    } catch {
      return options.initialValue;
    }
  });

  const readStorage = useEventCallback(() => {
    try {
      setValue(readValue(window.localStorage.getItem(options.key)));
    } catch {
      // NOTE: Games remain usable when browser storage is unavailable.
    }
  });

  const writeValue = useEventCallback((nextValue: T) => {
    try {
      window.localStorage.setItem(options.key, JSON.stringify(nextValue));
      window.dispatchEvent(
        new CustomEvent(storageEvent, { detail: options.key }),
      );
    } catch {
      // NOTE: Persisting is optional when the browser denies storage access.
    }

    setValue(nextValue);
  });

  React.useLayoutEffect(() => {
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
