import type { BranchContextValue } from "#contexts/BranchContext.tsx";
import { useBranchContext } from "#contexts/BranchContext.tsx";
import type { GameContextValue } from "#contexts/GameContext.tsx";
import { useGameContext } from "#contexts/GameContext.tsx";
import type { BranchId } from "#types.ts";
import { useMemo } from "react";

export type Navigation<TBranchId extends string = BranchId> = Pick<
  GameContextValue<TBranchId>,
  "goToBranch" | "goToLocation"
> &
  Pick<BranchContextValue<TBranchId>, "goToStatement" | "goToNextStatement">;

/** Read navigation for choices and custom commands inside the active branch. */
export function useNavigation<
  TBranchId extends string = BranchId,
>(): Navigation<TBranchId> {
  const { goToBranch, goToLocation } = useGameContext<TBranchId>();
  const { goToStatement, goToNextStatement } = useBranchContext<TBranchId>();

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
