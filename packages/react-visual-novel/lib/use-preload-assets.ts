import { useEventCallback } from "#lib/use-event-callback.ts";
import asyncPreloader from "async-preloader";
import React from "react";
import { useResult } from "./use-result.ts";

export function usePreloadAssets(
  assets: Record<string, string | { src: string }>,
  {
    concurrency,
    onLoaded,
  }: {
    concurrency?: number;
    onLoaded?: () => void;
  } = {},
) {
  const [res, setRes] = useResult<Error, undefined>();

  const [progress, setProgress] = React.useState(0);

  const handleLoaded = useEventCallback(() => {
    onLoaded?.();
  });

  React.useEffect(() => {
    const load = async () => {
      try {
        const srcs = Object.values(assets).map((a) =>
          typeof a === "object" ? a.src : a,
        );

        if (srcs.length > 0) {
          await preloadAssets(srcs, { concurrency, onProgress: setProgress });
        }

        setRes({ status: "success", data: undefined });
        handleLoaded();
      } catch (error) {
        setRes({
          status: "failure",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    scheduleIdleCallback(() => {
      // The load operation converts its rejection into the result state.
      void load().catch((error: unknown) => {
        console.error("Unable to report asset preloading result", error);
      });
    });
  }, [assets, concurrency, handleLoaded, setRes]);
  return [res, progress] as const;
}

async function preloadAssets(
  srcs: string[],
  {
    concurrency = srcs.length,
    onProgress,
  }: {
    concurrency?: number;
    onProgress?: (progress: number) => void;
  } = {},
) {
  if (typeof concurrency !== "number" || !(concurrency >= 1)) {
    throw new RangeError("Preload concurrency must be at least one");
  }

  let nextIndex = 0;
  let loadedCount = 0;
  const errors: Error[] = [];

  const loadNext = async () => {
    while (nextIndex < srcs.length) {
      const index = nextIndex;

      nextIndex += 1;

      const src = srcs[index];
      if (src === undefined) {
        continue;
      }

      try {
        await asyncPreloader.loadItem({ src });
        loadedCount += 1;
        onProgress?.(loadedCount / srcs.length);
      } catch (error) {
        const failure = new Error(
          error instanceof Error ? error.message : String(error),
          { cause: error },
        );

        errors.push(Object.assign(failure, { item: src, raw: error }));
      }
    }
  };

  // NOTE: Workers claim each item before awaiting it. A failed asset does not
  // stop the queue, and the result waits for every worker before reporting it.
  await Promise.all(
    Array.from(
      { length: Math.min(Math.ceil(concurrency), srcs.length) },
      loadNext,
    ),
  );

  if (errors.length > 0) {
    throw new AggregateError(errors, "Unable to preload assets");
  }
}

function scheduleIdleCallback(callback: IdleRequestCallback) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback);
  } else {
    requestIdleCallbackShim(callback);
  }
}

function requestIdleCallbackShim(cb: IdleRequestCallback) {
  const start = Date.now();

  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start));
      },
    });
  }, 1);
}
