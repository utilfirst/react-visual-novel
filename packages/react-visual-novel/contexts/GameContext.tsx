import {useLocalStorageValue, useUpdateEffect} from '@react-hookz/web'
import {Howler} from 'howler'
import React from 'react'
import {StringParam, useQueryParam, withDefault} from 'use-query-params'
import type {BranchId} from '../types'
import type {GameHistory, GameLocation} from './internal'
import {
  makeGameHistory,
  makeGameLocationId,
  parseGameLocation,
} from './internal'
import {unmute} from './internal/vendor/unmute'

export type SoundName = 'click' | 'mouseover' | 'skip' | 'not_allowed'

export interface GameOptions {
  onGoToRoot: () => void
  onLinkClick: (href: string, name: string, event: React.MouseEvent) => void
  onPlaySound: (name: SoundName) => void
}

export interface GameContextValue {
  focusedLocation: GameLocation
  muted: boolean
  setMuted: React.Dispatch<boolean>
  paused: boolean
  setPaused: React.Dispatch<boolean>
  goToBranch: (branchId: BranchId) => void
  goToLocation: (branchId: BranchId, statementIndex: number) => void
  goBack: () => boolean
  canGoBack: () => boolean
  goToRoot: () => void
  handleLinkClick: (href: string, name: string, event: React.MouseEvent) => void
  playSound: (name: SoundName) => void
}

const GameContext = React.createContext<GameContextValue | null>(null)

export interface GameProviderProps {
  children: React.ReactNode
  initialBranchId: BranchId
  onGoToRoot: () => void
  onLinkClick: (href: string, name: string, event: React.MouseEvent) => void
  onPlaySound: (name: SoundName) => void
}

export function GameProvider({
  children,
  initialBranchId,
  onGoToRoot,
  onLinkClick,
  onPlaySound,
}: GameProviderProps) {
  const initialLocation: GameLocation = {
    branchId: initialBranchId,
    statementIndex: 0,
  }
  const [storedFocusedLocationId, setStoredFocusedLocationId] = useQueryParam(
    'location',
    withDefault(StringParam, makeGameLocationId(initialLocation)),
  )
  const [focusedLocation, setFocusedLocation] = React.useState(
    () => parseGameLocation(storedFocusedLocationId) ?? initialLocation,
  )
  const [muted, setMuted] = React.useState(false)
  const [paused, setPaused] = useLocalStorageValue('@GameContext/paused', false)
  const [locations, setLocations] = useLocalStorageValue<GameLocation[]>(
    '@GameContext/locations',
    [focusedLocation],
  )
  const [history] = React.useState<GameHistory>(() =>
    makeGameHistory({
      locations,
      onChange: (newLocations) => {
        setLocations(newLocations)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setFocusedLocation(newLocations[newLocations.length - 1]!)
      },
    }),
  )

  React.useEffect(
    () => {
      Howler.mute(muted)
      // Enables web audio playback with the iOS mute switch on
      // https://github.com/swevans/unmute
      const handle = unmute(Howler.ctx, false, false)
      return () => handle.dispose()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useUpdateEffect(() => {
    Howler.mute(muted)
  }, [muted])

  useUpdateEffect(
    () => {
      setStoredFocusedLocationId(makeGameLocationId(focusedLocation))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedLocation],
  )

  useUpdateEffect(
    () => {
      const storedFocusedLocation = parseGameLocation(storedFocusedLocationId)
      if (
        storedFocusedLocation &&
        (storedFocusedLocation.branchId !== focusedLocation.branchId ||
          storedFocusedLocation.statementIndex !==
            focusedLocation.statementIndex)
      ) {
        history.reset(storedFocusedLocation)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storedFocusedLocationId],
  )

  const ctx = React.useMemo(
    (): GameContextValue => ({
      focusedLocation,
      muted,
      setMuted,
      paused,
      setPaused,
      goToBranch: (branchId) => {
        if (branchId !== focusedLocation.branchId) {
          history.push({branchId, statementIndex: 0})
        }
      },
      goToLocation: (branchId, statementIndex) => {
        if (
          branchId !== focusedLocation.branchId ||
          statementIndex !== focusedLocation.statementIndex
        ) {
          history.push({branchId, statementIndex})
        }
      },
      goBack: () => {
        const ok = history.goBack()
        if (ok) {
          setPaused(true)
        }
        return ok
      },
      canGoBack: history.canGoBack,
      goToRoot: onGoToRoot,
      handleLinkClick: onLinkClick,
      playSound: (name) => {
        if (!muted) {
          onPlaySound(name)
        }
      },
    }),
    [
      focusedLocation,
      history,
      muted,
      onGoToRoot,
      onLinkClick,
      onPlaySound,
      paused,
      setMuted,
      setPaused,
    ],
  )

  return <GameContext.Provider value={ctx}>{children}</GameContext.Provider>
}

export function useGameContext() {
  const ctx = React.useContext(GameContext)
  if (!ctx) {
    throw new Error('`useGameContext` can only be used inside a Game component')
  }
  return ctx
}
