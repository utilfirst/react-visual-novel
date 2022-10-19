import {usePreloadAssets} from './usePreloadAssets'
import React from 'react'

export interface WithAssetsProps {
  assets: Record<string, string | {src: string}>
  children: React.ReactNode
  onLoaded?: () => void
}

export function WithAssets({assets, children, onLoaded}: WithAssetsProps) {
  const [res, progress] = usePreloadAssets(assets, {onLoaded})
  if (res.status === 'loading') {
    return (
      <div className="prose flex h-full w-full flex-col items-center justify-center space-y-2 p-8">
        <span>Loading…</span>
        <progress
          value={progress * 100}
          max={100}
          className="progress w-full"
        />
      </div>
    )
  }
  if (res.status === 'failure') {
    return (
      <div className="prose flex h-full w-full flex-col items-center justify-center space-y-2 p-8">
        <h1>Unable to preload assets</h1>

        <pre className="alert alert-error items-start whitespace-pre-line font-mono">
          {res.error.message}
        </pre>
      </div>
    )
  }
  return <>{children}</>
}
