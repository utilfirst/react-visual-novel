import {
  ArrowCounterClockwise as ArrowCounterClockwiseIcon,
  ArrowLeft as ArrowLeftIcon,
  House as HouseIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
  SpeakerHigh as SpeakerHighIcon,
  SpeakerSlash as SpeakerSlashIcon,
} from 'phosphor-react'
import React from 'react'
import type {SoundName} from '../contexts'
import {BranchProvider, GameProvider, useGameContext} from '../contexts'
import type {Result} from '../lib'
import {usePreloadAssets} from '../lib'
import type {Branches, BranchId} from '../types'

export interface GameProps {
  assets: Record<string, string | {src: string}>
  branches: Branches
  initialBranchId: BranchId
  onLinkClick?: (href: string, name: string, event: React.MouseEvent) => void
  onPlaySound?: (name: SoundName) => void
  onGoHome?: () => void
  children?: (
    render: () => React.ReactNode,
    preloadRes: Result<Error, undefined>,
    preloadProgress: number,
  ) => React.ReactNode
}

export function Game({
  assets,
  branches,
  initialBranchId,
  onLinkClick,
  onPlaySound,
  onGoHome,
  children,
}: GameProps) {
  return (
    <GameProvider
      initialBranchId={initialBranchId}
      onLinkClick={onLinkClick}
      onPlaySound={onPlaySound}
      onGoHome={onGoHome}
    >
      <GameView
        assets={assets}
        branches={branches}
        initialBranchId={initialBranchId}
      >
        {children}
      </GameView>
    </GameProvider>
  )
}

// MARK: GameView

interface GameViewProps {
  assets: Record<string, string | {src: string}>
  branches: Branches
  initialBranchId: BranchId
  children?: (
    render: () => React.ReactNode,
    preloadRes: Result<Error, undefined>,
    preloadProgress: number,
  ) => React.ReactNode
}

function GameView({
  assets,
  branches,
  initialBranchId,
  children = (render) => render(),
}: GameViewProps) {
  const {
    focusedLocation,
    muted,
    setMuted,
    paused,
    setPaused,
    goToLocation,
    goBack,
    canGoBack,
    goHome,
    playSound,
  } = useGameContext()
  const [preloaded, setPreloaded] = React.useState(false)
  const [preloadRes, preloadProgress] = usePreloadAssets(assets, {
    onLoaded: () => setPreloaded(true),
  })
  return (
    <>
      <div className="absolute z-[120] flex w-full p-4">
        <div className="flex flex-1 space-x-2">
          {preloaded && canGoBack() && (
            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                goBack()
              }}
              className="rvn-icon-button"
            >
              <ArrowLeftIcon />
            </button>
          )}
        </div>

        <div className="flex flex-1 justify-end space-x-2">
          {preloaded && (
            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                goToLocation(initialBranchId, 0)
              }}
              className="rvn-icon-button"
            >
              <ArrowCounterClockwiseIcon />
            </button>
          )}

          {goHome && (
            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                goHome()
              }}
              className="rvn-icon-button"
            >
              <HouseIcon />
            </button>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[120] space-x-2">
        {preloaded && (
          <>
            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                setMuted(!muted)
              }}
              className="rvn-icon-button"
            >
              {muted ? <SpeakerSlashIcon /> : <SpeakerHighIcon />}
            </button>

            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                setPaused(!paused)
              }}
              className="rvn-icon-button"
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
          </>
        )}
      </div>

      {children(
        () => (
          <div className="flex h-full w-full overflow-hidden">
            {Object.entries(branches).map(
              ([branchId, BranchComp]) =>
                branchId === focusedLocation.branchId && (
                  <BranchProvider
                    key={branchId}
                    branchId={branchId as BranchId}
                  >
                    <BranchComp />
                  </BranchProvider>
                ),
            )}
          </div>
        ),
        preloadRes,
        preloadProgress,
      )}
    </>
  )
}

// MARK: Helpers

export function prepareBranches<
  TRawBranches extends Record<string, React.ComponentType>,
>(_branches: TRawBranches) {
  const branches = Object.fromEntries(
    Object.entries(_branches)
      .filter(([exportName]) => exportName.startsWith('Branch'))
      .map(([exportName, exportVal]) => [
        exportName.replace(BRANCH_PREFIX_RE, ''),
        exportVal,
      ]),
  ) as {
    [K in keyof typeof _branches as K extends `Branch${infer TId}`
      ? TId
      : never]: typeof _branches[K]
  }
  return branches
}

const BRANCH_PREFIX_RE = /^Branch/
