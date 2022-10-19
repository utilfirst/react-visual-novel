import type {BranchId} from '../types'
import {useGameContext} from './GameContext'
import {useMeasure} from '@react-hookz/web'
import React from 'react'
import {twMerge} from 'tailwind-merge'
import useEventCallback from 'use-event-callback'
import {useLongPress} from 'use-long-press'

export type StatementBehavior =
  | ['skippable_timed', {durationMs: number}]
  | ['skippable_static']
  | ['non_skippable']

export interface Statement {
  index: number
  label: string | null
  command: string
  behavior: StatementBehavior
  hide: number | ((statement: Statement) => boolean)
  next: number | string
  enter: () => void
  pause: () => void
  resume: () => void
}

export interface BranchContextValue {
  branchId: BranchId
  containerRect: DOMRectReadOnly
  registerStatement: (statement: Statement) => void
  getStatement: (statementIndex: number) => Statement | undefined
  getStatementCount: () => number
  focusedStatementIndex: number
  goToStatement: (statementLabel: string) => void
  goToNextStatement: (plusIndex?: number) => void
}

const BranchContext = React.createContext<BranchContextValue | null>(null)

export interface BranchProviderProps {
  branchId: BranchId
  children: React.ReactNode
}

export function BranchProvider({branchId, children}: BranchProviderProps) {
  const {focusedLocation, goToLocation, goBack, canGoBack, playSound} =
    useGameContext()
  const focusedStatementIndex =
    focusedLocation.branchId === branchId ? focusedLocation.statementIndex : 0

  const [statementByIndex] = React.useState(() => new Map<number, Statement>())
  const [statementByLabel] = React.useState(() => new Map<string, Statement>())
  const [containerRect, containerRef] = useMeasure<HTMLDivElement>()

  const goToNextStatement = useEventCallback((plusIndex: number = 0) => {
    const focusedStatement = statementByIndex.get(focusedStatementIndex)
    const nextStatement =
      typeof focusedStatement?.next === 'string'
        ? statementByLabel.get(focusedStatement.next)
        : statementByIndex.get(
            Math.min(
              statementByIndex.size - 1,
              focusedStatementIndex + (focusedStatement?.next ?? 1) + plusIndex,
            ),
          )
    if (nextStatement) {
      goToLocation(branchId, nextStatement.index)
    }
  })
  const ctx = React.useMemo(
    (): BranchContextValue | null =>
      containerRect
        ? {
            branchId,
            containerRect,
            registerStatement: (statement) => {
              statementByIndex.set(statement.index, statement)
              if (statement.label) {
                if (statementByLabel.has(statement.label)) {
                  throw new Error(
                    `Duplicate statement label: ${statement.label}`,
                  )
                }
                statementByLabel.set(statement.label, statement)
              }
              return () => {
                statementByIndex.delete(statement.index)
                if (statement.label) {
                  statementByLabel.delete(statement.label)
                }
              }
            },
            getStatement: (statementIndex) =>
              statementByIndex.get(statementIndex),
            getStatementCount: () => statementByIndex.size,
            focusedStatementIndex,
            goToStatement: (statementLabel) => {
              const statement = statementByLabel.get(statementLabel)
              if (!statement) {
                throw new Error(`Unknown statement label: ${statementLabel}`)
              }
              goToLocation(branchId, statement?.index)
            },
            goToNextStatement,
          }
        : null,
    [
      branchId,
      containerRect,
      focusedStatementIndex,
      goToLocation,
      goToNextStatement,
      statementByIndex,
      statementByLabel,
    ],
  )

  const ignoreClickRef = React.useRef(false)
  const bindLongPress = useLongPress(
    () => {
      statementByIndex.get(focusedStatementIndex)?.pause()
      ignoreClickRef.current = true
    },
    {
      onFinish: () => {
        statementByIndex.get(focusedStatementIndex)?.resume()
      },
    },
  )

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onClick={(event) => {
        if (ignoreClickRef.current) {
          ignoreClickRef.current = false
          return
        }

        const targetContained =
          event.currentTarget === event.target ||
          (event.currentTarget as Element).contains(event.target as Element)
        if (!targetContained) {
          return
        }

        const command = statementByIndex.get(focusedStatementIndex)
        if (command?.behavior[0].startsWith('skippable')) {
          playSound('skip')
          const focusedStatement = statementByIndex.get(focusedStatementIndex)
          const entered = focusedStatement?.enter() ?? false
          // Complete entrance animation before jumping to next statement
          if (!entered) {
            goToNextStatement()
          }
        }
      }}
      className="relative flex-1 select-none"
      {...bindLongPress()}
    >
      <div
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation()
          if (!canGoBack()) {
            playSound('not_allowed')
            return
          }

          playSound('skip')
          goBack()
        }}
        className={twMerge(
          'absolute left-0 z-[110] h-full w-16 cursor-pointer from-current to-transparent',
          canGoBack() && 'hover:bg-gradient-to-r',
        )}
        style={{color: 'rgba(0, 0, 0, .35)'}}
      />

      {ctx && (
        <BranchContext.Provider value={ctx}>{children}</BranchContext.Provider>
      )}
    </div>
  )
}

export function useBranchContext() {
  const ctx = React.useContext(BranchContext)
  if (!ctx) {
    throw new Error(
      '`useBranchContext` can only be used inside a Game component',
    )
  }
  return ctx
}
