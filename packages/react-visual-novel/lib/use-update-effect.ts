import React from "react";

export function useUpdateEffect(
  effect: React.EffectCallback,
  dependencies: React.DependencyList,
) {
  const isFirstMountRef = React.useRef(true);
  const isFirstMount = isFirstMountRef.current;

  React.useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  // NOTE: Capture the render's mount state so Strict Mode's effect replay
  // continues to skip the initial query write.
  React.useEffect(() => {
    if (!isFirstMount) {
      return effect();
    }

    return undefined;
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- The caller owns the effect dependencies, as with useEffect.
  }, dependencies);
}
