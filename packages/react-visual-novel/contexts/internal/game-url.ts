import { useSyncExternalStore } from "react";

const locationListeners = new Set<() => void>();
let restoreHistory: (() => void) | null = null;

export type GameLocationWriteOptions = {
  locationId: string;
  replace?: boolean;
};

export function useGameLocationId(initialLocationId: string) {
  const locationId = useSyncExternalStore(
    subscribeGameLocation,
    readGameLocationId,
    readServerGameLocationId,
  );

  return [locationId ?? initialLocationId, writeGameLocationId] as const;
}

export function writeGameLocationId(options: GameLocationWriteOptions) {
  const url = new URL(window.location.href);
  if (url.searchParams.get("location") === options.locationId) {
    return;
  }

  url.searchParams.set("location", options.locationId);

  // NOTE: Pass fresh state so router wrappers treat this as host navigation.
  // Reusing a router's internal state can bypass its URL synchronization.
  if (options.replace === true) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

export function readGameLocationId(): string | null {
  return new URLSearchParams(window.location.search).get("location");
}

function readServerGameLocationId(): null {
  return null;
}

function subscribeGameLocation(listener: () => void) {
  locationListeners.add(listener);
  if (locationListeners.size === 1) {
    restoreHistory = observeGameLocation();
  }

  return () => {
    locationListeners.delete(listener);
    if (locationListeners.size === 0) {
      restoreHistory?.();
      restoreHistory = null;
    }
  };
}

function observeGameLocation() {
  const history = window.history;
  // oxlint-disable-next-line typescript/unbound-method -- The wrapper forwards the original receiver with `apply` and restores this exact method.
  const originalPushState = history.pushState;
  // oxlint-disable-next-line typescript/unbound-method -- The wrapper forwards the original receiver with `apply` and restores this exact method.
  const originalReplaceState = history.replaceState;

  // NOTE: Native history writes do not emit `popstate`. Observe both host
  // and game writes, preserving each host wrapper and its receiver binding.
  function pushState(this: History, ...args: Parameters<History["pushState"]>) {
    originalPushState.apply(this, args);
    notifyGameLocation();
  }

  function replaceState(
    this: History,
    ...args: Parameters<History["replaceState"]>
  ) {
    originalReplaceState.apply(this, args);
    notifyGameLocation();
  }

  history.pushState = pushState;
  history.replaceState = replaceState;
  window.addEventListener("popstate", notifyGameLocation);

  return () => {
    window.removeEventListener("popstate", notifyGameLocation);

    // NOTE: A host can install another wrapper while the game is mounted.
    // Restore only methods still owned by this subscription.
    if (history.pushState === pushState) {
      history.pushState = originalPushState;
    }
    if (history.replaceState === replaceState) {
      history.replaceState = originalReplaceState;
    }
  };
}

function notifyGameLocation() {
  for (const listener of Array.from(locationListeners)) {
    listener();
  }
}
