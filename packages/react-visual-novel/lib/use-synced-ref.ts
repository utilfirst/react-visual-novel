import React from "react";

export function useSyncedRef<T>(value: T) {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}
