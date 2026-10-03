import { useLayoutEffect, useState } from "react";

export function useMeasure<TElement extends Element>() {
  const [element, setElement] = useState<TElement | null>(null);
  const [rect, setRect] = useState<DOMRectReadOnly>();

  useLayoutEffect(() => {
    if (element === null) {
      return undefined;
    }

    let frame: number | undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }

      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        setRect(entry.contentRect);
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }
    };
  }, [element]);

  return [rect, setElement] as const;
}
