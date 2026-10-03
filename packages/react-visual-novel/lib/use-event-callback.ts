import React from "react";

export function useEventCallback<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  const callbackRef = React.useRef(callback);
  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return React.useCallback(
    (...args: TArgs) => callbackRef.current(...args),
    [],
  );
}
