import React from "react";

export function useSyncedRef<T>(value: T) {
  const ref = React.useRef(value);
  React.useLayoutEffect(() => {
    // NOTE: Pending playback must observe committed state, not a render
    // that React can discard.
    ref.current = value;
  });
  return ref;
}
