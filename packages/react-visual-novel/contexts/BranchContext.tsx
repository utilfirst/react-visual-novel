import { GameHistoryContext } from "#contexts/internal/game-history-context.ts";
import { useEventCallback } from "#lib/use-event-callback.ts";
import { useLongPress } from "#lib/use-long-press.ts";
import { useMeasure } from "#lib/use-measure.ts";
import type { BranchId } from "#types.ts";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { twMerge } from "tailwind-merge";
import { useGameContext } from "./GameContext.tsx";

export type StatementBehavior =
  | ["skippable_timed", { durationMs: number }]
  | ["skippable_static"]
  | ["non_skippable"];

// oxlint-disable-next-line typescript/no-invalid-void-type -- Custom providers may return void. Built-in providers expose their registration cleanup.
export type StatementRegistrationCleanup = void | (() => void);

export type Statement = {
  index: number;
  label: string | null;
  command: string;
  behavior: StatementBehavior;
  hide: number | ((statement: Statement) => boolean);
  next: number | string;
  // oxlint-disable-next-line typescript/no-invalid-void-type -- Published custom statements may return void. Built-in commands return whether their entrance was completed.
  enter: () => boolean | void;
  pause: () => void;
  resume: () => void;
};

export type BranchContextValue = {
  branchId: BranchId;
  containerRect: DOMRectReadOnly;
  registerStatement: (statement: Statement) => StatementRegistrationCleanup;
  getStatement: (statementIndex: number) => Statement | undefined;
  getStatementCount: () => number;
  focusedStatementIndex: number;
  goToStatement: (statementLabel: string) => void;
  goToNextStatement: (plusIndex?: number) => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export type BranchProviderProps = {
  branchId: BranchId;
  children: ReactNode;
};

export function BranchProvider(props: BranchProviderProps) {
  const { branchId } = props;

  const { focusedLocation, goToLocation, goBack, canGoBack, playSound } =
    useGameContext();

  const gameHistory = useContext(GameHistoryContext);

  if (gameHistory === null) {
    throw new Error("`BranchProvider` requires a GameProvider history");
  }

  const focusedStatementIndex =
    focusedLocation.branchId === branchId ? focusedLocation.statementIndex : 0;

  const ignoreClickRef = useRef(false);

  const statementByIndex = useRef(new Map<number, Statement>()).current;
  const statementByLabel = useRef(new Map<string, Statement>()).current;

  const [containerRect, containerRef] = useMeasure<HTMLDivElement>();

  const registerStatement = useCallback(
    (statement: Statement) => {
      if (
        statement.label !== null &&
        statement.label !== "" &&
        statementByLabel.has(statement.label)
      ) {
        throw new Error(`Duplicate statement label: ${statement.label}`);
      }

      statementByIndex.set(statement.index, statement);
      if (statement.label !== null && statement.label !== "") {
        statementByLabel.set(statement.label, statement);
      }

      return () => {
        // NOTE: A replaced registration can finish cleanup after its
        // successor registers. Release only this statement's entries.
        if (statementByIndex.get(statement.index) === statement) {
          statementByIndex.delete(statement.index);
        }
        if (
          statement.label !== null &&
          statementByLabel.get(statement.label) === statement
        ) {
          statementByLabel.delete(statement.label);
        }
      };
    },
    [statementByIndex, statementByLabel],
  );

  const goToNextStatement = useEventCallback((plusIndex?: number) => {
    const focusedStatement = statementByIndex.get(focusedStatementIndex);

    const nextStatement =
      typeof focusedStatement?.next === "string"
        ? statementByLabel.get(focusedStatement.next)
        : statementByIndex.get(
            Math.min(
              statementByIndex.size - 1,
              focusedStatementIndex +
                (focusedStatement?.next ?? 1) +
                (plusIndex ?? 0),
            ),
          );

    if (nextStatement) {
      goToLocation(branchId, nextStatement.index);
    }
  });

  const ctx = useMemo(
    (): BranchContextValue | null =>
      containerRect
        ? {
            branchId,
            containerRect,
            registerStatement,
            getStatement: (statementIndex) =>
              statementByIndex.get(statementIndex),
            getStatementCount: () => statementByIndex.size,
            focusedStatementIndex,
            goToStatement: (statementLabel) => {
              const statement = statementByLabel.get(statementLabel);
              if (!statement) {
                throw new Error(`Unknown statement label: ${statementLabel}`);
              }

              goToLocation(branchId, statement.index);
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
      registerStatement,
      statementByIndex,
      statementByLabel,
    ],
  );

  const advanceStatement = useEventCallback(() => {
    const statement = statementByIndex.get(focusedStatementIndex);
    if (statement?.behavior[0].startsWith("skippable") === true) {
      playSound("skip");
      // Finish the entrance before advancing to the next statement.
      if (statement.enter() !== true) {
        goToNextStatement();
      }
    }
  });

  const longPressHandlers = useLongPress({
    onStart: () => {
      statementByIndex.get(focusedStatementIndex)?.pause();
      ignoreClickRef.current = true;
    },
    onFinish: () => {
      statementByIndex.get(focusedStatementIndex)?.resume();
    },
  });

  useEffect(() => {
    // NOTE: Child command effects register before this parent effect. Reset
    // invalid destinations instead of retaining them in the back stack.
    const firstStatementIndex = statementByIndex.keys().next().value;
    if (
      firstStatementIndex !== undefined &&
      !statementByIndex.has(focusedStatementIndex)
    ) {
      const location = { branchId, statementIndex: firstStatementIndex };
      gameHistory.reset(location);
    }
  }, [
    branchId,
    containerRect,
    focusedStatementIndex,
    gameHistory,
    statementByIndex,
  ]);

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- This ancestor delegates stage clicks. The advance button supplies keyboard activation, and choices stop propagation.
    <div
      ref={containerRef}
      onClick={(event) => {
        if (ignoreClickRef.current) {
          ignoreClickRef.current = false;
          return;
        }

        const targetContained =
          event.currentTarget === event.target ||
          (event.target instanceof Node &&
            event.currentTarget.contains(event.target));

        if (!targetContained) {
          return;
        }

        advanceStatement();
      }}
      className="relative flex-1 select-none"
      {...longPressHandlers}
    >
      <button
        type="button"
        aria-label="Advance visual novel statement"
        className="absolute inset-0 w-full appearance-none border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      />

      <button
        type="button"
        aria-label="Previous statement"
        onClick={(event) => {
          event.stopPropagation();

          if (!canGoBack()) {
            playSound("not_allowed");
            return;
          }

          playSound("skip");
          goBack();
        }}
        className={twMerge(
          "absolute left-0 z-[110] h-full w-16 cursor-pointer appearance-none border-0 bg-transparent from-current to-transparent p-0",
          canGoBack() && "hover:bg-linear-to-r",
        )}
        style={{ color: "rgba(0, 0, 0, .35)" }}
      />

      {ctx && (
        <BranchContext.Provider value={ctx}>
          {props.children}
        </BranchContext.Provider>
      )}
    </div>
  );
}

export function useBranchContext() {
  const ctx = useContext(BranchContext);

  if (!ctx) {
    throw new Error(
      "`useBranchContext` can only be used inside a Game component",
    );
  }

  return ctx;
}
