import {PromisePool} from '@supercharge/promise-pool'
import asyncPreloader from 'async-preloader'
import React from 'react'
import useEventCallback from 'use-event-callback'
import {useResult} from './useResult'

export function usePreloadAssets(
  assets: Record<string, string | {src: string}>,
  {
    concurrency,
    onLoaded,
  }: {
    concurrency?: number
    onLoaded?: () => void
  } = {},
) {
  const [res, setRes] = useResult<Error, undefined>()
  const [progress, setProgress] = React.useState(0)
  const handleLoaded = useEventCallback(onLoaded ?? (() => {}))
  React.useEffect(() => {
    requestIdleCallback(async () => {
      try {
        const srcs = Object.values(assets).map((a) =>
          typeof a === 'object' ? a.src : a,
        )
        if (srcs.length > 0) {
          await preloadAssets(srcs, {concurrency, onProgress: setProgress})
        }
        setRes({status: 'success', data: undefined})
        handleLoaded()
      } catch (err) {
        setRes({
          status: 'failure',
          error: err instanceof Error ? err : new Error(String(err)),
        })
      }
    })
  }, [assets, concurrency, handleLoaded, setRes])
  return [res, progress] as const
}

async function preloadAssets(
  srcs: string[],
  {
    concurrency = srcs.length,
    onProgress,
  }: {
    concurrency?: number
    onProgress?: (progress: number) => void
  } = {},
) {
  let loadedCount = 0
  await PromisePool.withConcurrency(concurrency)
    .for(srcs)
    .process(async (src) => {
      await asyncPreloader.loadItem({src})
      loadedCount += 1
      onProgress?.(loadedCount / srcs.length)
    })
}

const requestIdleCallback =
  window.requestIdleCallback || requestIdleCallbackShim

// Shim from https://developers.google.com/web/updates/2015/08/using-requestidlecallback
function requestIdleCallbackShim(cb: IdleRequestCallback) {
  const start = Date.now()
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start))
      },
    })
  }, 1)
}
