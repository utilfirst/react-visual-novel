import type { BranchId } from "#types.ts";
import { useMeasure } from "@react-hookz/web";
import React from "react";
import { twMerge } from "tailwind-merge";
import useEventCallback from "use-event-callback";
import { useLongPress } from "use-long-press";
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

const BranchContext = React.createContext<BranchContextValue | null>(null);

export type BranchProviderProps = {
  branchId: BranchId;
  children: React.ReactNode;
};

export function BranchProvider(props: BranchProviderProps) {
  const { branchId } = props;

  const { focusedLocation, goToLocation, goBack, canGoBack, playSound } =
    useGameContext();

  const focusedStatementIndex =
    focusedLocation.branchId === branchId ? focusedLocation.statementIndex : 0;

  const statementByIndex = React.useRef(new Map<number, Statement>()).current;
  const statementByLabel = React.useRef(new Map<string, Statement>()).current;

  const [containerRect, containerRef] = useMeasure<HTMLDivElement>();

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

  const ctx = React.useMemo(
    (): BranchContextValue | null =>
      containerRect
        ? {
            branchId,
            containerRect,
            registerStatement: (statement) => {
              statementByIndex.set(statement.index, statement);
              if (statement.label !== null && statement.label !== "") {
                if (statementByLabel.has(statement.label)) {
                  throw new Error(
                    `Duplicate statement label: ${statement.label}`,
                  );
                }

                statementByLabel.set(statement.label, statement);
              }

              return () => {
                statementByIndex.delete(statement.index);
                if (statement.label !== null && statement.label !== "") {
                  statementByLabel.delete(statement.label);
                }
              };
            },
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
      statementByIndex,
      statementByLabel,
    ],
  );

  const ignoreClickRef = React.useRef(false);

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

  const bindLongPress = useLongPress(
    () => {
      statementByIndex.get(focusedStatementIndex)?.pause();
      ignoreClickRef.current = true;
    },
    {
      onFinish: () => {
        statementByIndex.get(focusedStatementIndex)?.resume();
      },
    },
  );

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
      {...bindLongPress()}
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
          canGoBack() && "hover:bg-gradient-to-r",
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
  const ctx = React.useContext(BranchContext);
  if (!ctx) {
    throw new Error(
      "`useBranchContext` can only be used inside a Game component",
    );
  }

  return ctx;
}
