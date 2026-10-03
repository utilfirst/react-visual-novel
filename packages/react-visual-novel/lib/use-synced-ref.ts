import { useLayoutEffect, useRef } from "react";

export function useSyncedRef<T>(value: T) {
  const ref = useRef(value);

  useLayoutEffect(() => {
    // NOTE: Pending playback must observe committed state, not a render
    // that React can discard.
    ref.current = value;
  });

  return ref;
}
