import { useEffect, useRef } from "react";
import { useEventCallback } from "./use-event-callback.ts";

type LongPressOptions = {
  onStart: () => void;
  onFinish: () => void;
};

export function useLongPress(options: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isPressedRef = useRef(false);
  const isLongPressRef = useRef(false);
  const onStart = useEventCallback(options.onStart);

  const finish = useEventCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
    isPressedRef.current = false;
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      options.onFinish();
    }
  });

  const start = useEventCallback(() => {
    if (isPressedRef.current) {
      return;
    }

    isPressedRef.current = true;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onStart();
    }, 400);
  });

  useEffect(() => {
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);

    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      clearTimeout(timerRef.current);
    };
  }, [finish]);

  return {
    onPointerDown: start,
    onPointerUp: finish,
    onPointerLeave: finish,
    onPointerCancel: finish,
  };
}
