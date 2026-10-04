import type { BranchContextValue } from "#contexts/BranchContext.tsx";
import { useBranchContext } from "#contexts/BranchContext.tsx";
import type { GameContextValue } from "#contexts/GameContext.tsx";
import { useGameContext } from "#contexts/GameContext.tsx";
import { useMemo } from "react";

export type Navigation = Pick<GameContextValue, "goToBranch" | "goToLocation"> &
  Pick<BranchContextValue, "goToStatement" | "goToNextStatement">;

/** Read navigation for choices and custom commands inside the active branch. */
export function useNavigation(): Navigation {
  const { goToBranch, goToLocation } = useGameContext();
  const { goToStatement, goToNextStatement } = useBranchContext();

  // NOTE: Keep the provider-owned functions intact so navigation retains
  // its synchronous history updates and committed statement callbacks.
  return useMemo(
    () => ({
      goToBranch,
      goToLocation,
      goToStatement,
      goToNextStatement,
    }),
    [goToBranch, goToLocation, goToStatement, goToNextStatement],
  );
}
