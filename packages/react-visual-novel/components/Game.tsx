import type {SoundName} from '../contexts'
import {BranchProvider, GameProvider, useGameContext} from '../contexts'
import type {Branches, BranchId} from '../types'
import {MobileDeviceChrome, WithAssets} from './internal'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {useRect} from '@radix-ui/react-use-rect'
import {
  ArrowCounterClockwise as ArrowCounterClockwiseIcon,
  ArrowLeft as ArrowLeftIcon,
  CaretRight as CaretRightIcon,
  House as HouseIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
  SpeakerHigh as SpeakerHighIcon,
  SpeakerSlash as SpeakerSlashIcon,
  Wrench as WrenchIcon,
  X as XIcon,
} from 'phosphor-react'
import React from 'react'

export interface GameProps {
  assets: Record<string, string | {src: string}>
  branches: Branches
  initialBranchId: BranchId
  onGoToRoot: () => void
  onLinkClick: (href: string, name: string, event: React.MouseEvent) => void
  onPlaySound: (name: SoundName) => void
}

export function Game({
  assets,
  branches,
  initialBranchId,
  onGoToRoot,
  onLinkClick,
  onPlaySound,
}: GameProps) {
  return (
    <GameProvider
      initialBranchId={initialBranchId}
      onGoToRoot={onGoToRoot}
      onLinkClick={onLinkClick}
      onPlaySound={onPlaySound}
    >
      <GameView
        assets={assets}
        branches={branches}
        initialBranchId={initialBranchId}
      />
    </GameProvider>
  )
}

// MARK: GameView

interface GameViewProps {
  assets: Record<string, string | {src: string}>
  branches: Branches
  initialBranchId: BranchId
}

function GameView({assets, branches, initialBranchId}: GameViewProps) {
  const {
    focusedLocation,
    muted,
    setMuted,
    paused,
    setPaused,
    goToLocation,
    goBack,
    canGoBack,
    goToRoot,
    playSound,
  } = useGameContext()
  const [loaded, setLoaded] = React.useState(false)
  return (
    <MobileDeviceChrome>
      <div className="navbar absolute z-[120] p-4">
        <div className="navbar-start space-x-2">
          {loaded && canGoBack() && (
            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                goBack()
              }}
              className="btn-ghost btn-circle btn bg-base-100 text-xl shadow-md hover:bg-base-200"
            >
              <ArrowLeftIcon />
            </button>
          )}
        </div>

        <div className="navbar-end space-x-2">
          {loaded && (
            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                goToLocation(initialBranchId, 0)
              }}
              className="btn-ghost btn-circle btn bg-base-100 text-xl shadow-md hover:bg-base-200"
            >
              <ArrowCounterClockwiseIcon />
            </button>
          )}

          <button
            onMouseEnter={() => playSound('mouseover')}
            onClick={() => {
              playSound('click')
              goToRoot()
            }}
            className="btn-ghost btn-circle btn bg-base-100 text-xl shadow-md hover:bg-base-200"
          >
            <HouseIcon />
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[120] space-x-2">
        {loaded && (
          <>
            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                setMuted(!muted)
              }}
              className="btn-ghost btn-circle btn bg-base-100 text-xl shadow-md hover:bg-base-200"
            >
              {muted ? <SpeakerSlashIcon /> : <SpeakerHighIcon />}
            </button>

            <button
              onMouseEnter={() => playSound('mouseover')}
              onClick={() => {
                playSound('click')
                setPaused(!paused)
              }}
              className="btn-ghost btn-circle btn bg-base-100 text-xl shadow-md hover:bg-base-200"
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
          </>
        )}

        {process.env['NODE_ENV'] === 'development' && (
          <DebugPopover branches={branches} />
        )}
      </div>

      <WithAssets assets={assets} onLoaded={() => setLoaded(true)}>
        <div className="flex h-full w-full overflow-hidden bg-base-100">
          {Object.entries(branches).map(
            ([branchId, BranchComp]) =>
              branchId === focusedLocation.branchId && (
                <BranchProvider key={branchId} branchId={branchId as BranchId}>
                  <BranchComp />
                </BranchProvider>
              ),
          )}
        </div>
      </WithAssets>
    </MobileDeviceChrome>
  )
}

// MARK: DebugPopover

interface DebugPopoverProps {
  branches: Branches
}

function DebugPopover({branches}: DebugPopoverProps) {
  const {goToLocation} = useGameContext()
  const [button, setButton] = React.useState<HTMLButtonElement | null>(null)
  const buttonRect = useRect(button)
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={setButton}
          className="btn-ghost btn-circle btn bg-base-100 text-xl shadow-md hover:bg-base-200"
        >
          <WrenchIcon />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Content
        align="center"
        side="top"
        sideOffset={4}
        className="no-animation flex flex-col overflow-hidden rounded-lg bg-base-100 p-2 shadow-md radix-side-top:animate-slide-up"
        style={{
          width: 'min(calc(100vw - 2rem), 30rem)',
          ...(buttonRect && {
            maxHeight: buttonRect.top - 4,
          }),
        }}
      >
        <div className="navbar">
          <div className="navbar-start"></div>
          <div className="navbar-end">
            <PopoverPrimitive.Close className="btn-ghost btn-sm btn-circle btn">
              <XIcon />
            </PopoverPrimitive.Close>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto">
          <div>
            <div className="prose p-2">
              <span className="text-lg font-semibold">Go to branch</span>
            </div>

            {Object.keys(branches).map((branchId) => (
              <button
                key={branchId}
                onClick={() => goToLocation(branchId as BranchId, 0)}
                className="btn-ghost btn-block btn-sm btn justify-between normal-case"
              >
                <span className="flex w-full flex-row items-center justify-between space-x-1">
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                    {branchId}
                  </span>

                  <CaretRightIcon />
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
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
