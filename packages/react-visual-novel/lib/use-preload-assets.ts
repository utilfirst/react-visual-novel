import { useEventCallback } from "#lib/use-event-callback.ts";
import asyncPreloader from "async-preloader";
import { useEffect, useState } from "react";
import type { Result } from "./result.ts";

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
  const [res, setRes] = useState<Result<Error, undefined>>({
    status: "loading",
  });

  const [progress, setProgress] = useState(0);

  const handleLoaded = useEventCallback(() => {
    onLoaded?.();
  });

  useEffect(() => {
    const controller = new AbortController();

    setRes({ status: "loading" });
    setProgress(0);

    const load = async () => {
      try {
        const srcs = Object.values(assets).map((a) =>
          typeof a === "object" ? a.src : a,
        );

        if (srcs.length > 0) {
          await preloadAssets({
            srcs,
            concurrency,
            signal: controller.signal,
            onProgress: (nextProgress) => {
              if (!controller.signal.aborted) {
                setProgress(nextProgress);
              }
            },
          });
        }
        if (controller.signal.aborted) {
          return;
        }

        setProgress(1);
        setRes({ status: "success", data: undefined });
        handleLoaded();
      } catch (error) {
        if (!controller.signal.aborted) {
          setRes({
            status: "failure",
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    };

    const cancelLoad = scheduleIdleCallback(() => {
      // NOTE: Asset failures are returned to the host. Report failures in
      // the result callback at the boundary that starts detached work.
      void load().catch((error: unknown) => {
        console.error("Unable to report asset preloading result", error);
      });
    });

    return () => {
      // NOTE: The loader cannot cancel an in-flight asset request. Abort
      // stops the remaining queue and prevents stale state and callbacks.
      controller.abort();
      cancelLoad();
    };
  }, [assets, concurrency, handleLoaded, setRes]);

  return [res, progress] as const;
}

type PreloadAssetsOptions = {
  srcs: string[];
  concurrency?: number;
  onProgress: (progress: number) => void;
  signal: AbortSignal;
};

async function preloadAssets(options: PreloadAssetsOptions) {
  const { srcs } = options;
  const concurrency = options.concurrency ?? srcs.length;
  if (typeof concurrency !== "number" || !(concurrency >= 1)) {
    throw new RangeError("Preload concurrency must be at least one");
  }

  let nextIndex = 0;
  let loadedCount = 0;
  const errors: Error[] = [];

  const loadNext = async () => {
    while (!options.signal.aborted && nextIndex < srcs.length) {
      const index = nextIndex;

      nextIndex += 1;

      const src = srcs[index];
      if (src === undefined) {
        continue;
      }

      try {
        await asyncPreloader.loadItem({ src });
        loadedCount += 1;
        options.onProgress(loadedCount / srcs.length);
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

function scheduleIdleCallback(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback);

    return () => {
      window.cancelIdleCallback(handle);
    };
  }

  const handle = setTimeout(callback, 1);

  return () => {
    clearTimeout(handle);
  };
}
