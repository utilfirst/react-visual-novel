import { PromisePool } from "@supercharge/promise-pool";
import asyncPreloader from "async-preloader";
import React from "react";
import useEventCallback from "use-event-callback";
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
  let loadedCount = 0;

  const { errors } = await PromisePool.withConcurrency(concurrency)
    .for(srcs)
    .process(async (src) => {
      await asyncPreloader.loadItem({ src });
      loadedCount += 1;
      onProgress?.(loadedCount / srcs.length);
    });

  // PromisePool collects item failures instead of rejecting its operation.
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
