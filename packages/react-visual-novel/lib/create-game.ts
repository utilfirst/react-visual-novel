import { Menu } from "#commands/Menu.tsx";
import { Say } from "#commands/Say.tsx";
import { MenuView } from "#commands/views/MenuView.tsx";
import { Game } from "#components/Game.tsx";
import { BranchProvider, useBranchContext } from "#contexts/BranchContext.tsx";
import { GameProvider, useGameContext } from "#contexts/GameContext.tsx";
import { useNavigation } from "./use-navigation.ts";

export type GameAuthoring<TBranchId extends string> = {
  Game: typeof Game<TBranchId>;
  GameProvider: typeof GameProvider<TBranchId>;
  BranchProvider: typeof BranchProvider<TBranchId>;
  Menu: typeof Menu<TBranchId>;
  Say: typeof Say<TBranchId>;
  MenuView: typeof MenuView<TBranchId>;
  useGameContext: typeof useGameContext<TBranchId>;
  useBranchContext: typeof useBranchContext<TBranchId>;
  useNavigation: typeof useNavigation<TBranchId>;
};

/** Bind authoring components and hooks to one game's branch identifiers. */
export function createGame<
  TBranchId extends string,
>(): GameAuthoring<TBranchId> {
  // NOTE: Instantiation expressions specialize types while preserving the
  // original component and hook identities, providers, and playback state.
  return {
    Game: Game<TBranchId>,
    GameProvider: GameProvider<TBranchId>,
    BranchProvider: BranchProvider<TBranchId>,
    Menu: Menu<TBranchId>,
    Say: Say<TBranchId>,
    MenuView: MenuView<TBranchId>,
    useGameContext: useGameContext<TBranchId>,
    useBranchContext: useBranchContext<TBranchId>,
    useNavigation: useNavigation<TBranchId>,
  };
}
