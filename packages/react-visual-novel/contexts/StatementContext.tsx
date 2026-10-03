import React from "react";
import type {
  Statement,
  StatementRegistrationCleanup,
} from "./BranchContext.tsx";
import { useBranchContext } from "./BranchContext.tsx";

export type StatementContextValue = {
  register: (
    statement: Omit<Statement, "index" | "label">,
  ) => StatementRegistrationCleanup;
  statementIndex: number;
  statementLabel: string | null;
  /** Is this the current statement? */
  focused: boolean;
  /** Is this statement still shown but not necessarily focused? */
  visible: boolean;
};

const StatementContext = React.createContext<StatementContextValue | null>(
  null,
);

export type StatementProviderProps = {
  statementIndex: number;
  statementLabel?: string | null;
  children: React.ReactNode;
};

export function StatementProvider(props: StatementProviderProps) {
  const { statementIndex } = props;
  const statementLabel = props.statementLabel ?? null;

  const branchCtx = useBranchContext();

  const [statement, setStatement] = React.useState<Statement | null>(null);

  const registerStatement = branchCtx.registerStatement;

  const register = React.useCallback(
    (definition: Omit<Statement, "index" | "label">) => {
      const registeredStatement: Statement = {
        ...definition,
        index: statementIndex,
        label: statementLabel,
      };

      const cleanup = registerStatement(registeredStatement);

      setStatement(registeredStatement);
      return cleanup;
    },
    [registerStatement, statementIndex, statementLabel],
  );

  const ctx = React.useMemo((): StatementContextValue => {
    const focused = branchCtx.focusedStatementIndex === statementIndex;
    let visible = focused;
    if (branchCtx.focusedStatementIndex > statementIndex) {
      if (statement?.hide === -1) {
        visible = true;
      } else if (typeof statement?.hide === "number") {
        visible =
          branchCtx.focusedStatementIndex <= statementIndex + statement.hide;
      } else if (typeof statement?.hide === "function") {
        visible = true;

        let currStatementIndex = statementIndex + 1;
        let currStatement = branchCtx.getStatement(currStatementIndex);
        while (
          currStatementIndex <= branchCtx.focusedStatementIndex &&
          currStatement != null
        ) {
          if (statement.hide(currStatement)) {
            visible = false;
            break;
          } else {
            currStatementIndex += 1;
            currStatement = branchCtx.getStatement(currStatementIndex);
          }
        }
      }
    }

    return {
      register,
      statementIndex,
      statementLabel,
      focused,
      visible,
    };
  }, [branchCtx, register, statement, statementIndex, statementLabel]);

  return (
    <StatementContext.Provider value={ctx}>
      {props.children}
    </StatementContext.Provider>
  );
}

export function useStatementContext() {
  const ctx = React.useContext(StatementContext);
  if (!ctx) {
    throw new Error(
      "`useStatementContext` can only be used inside a Command component",
    );
  }

  return ctx;
}
