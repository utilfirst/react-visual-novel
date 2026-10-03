import type { GameLocation } from "./game-location.ts";

export type GameHistory = {
  peek: () => GameLocation;
  push: (location: GameLocation) => void;
  reset: (location: GameLocation) => void;
  goBack: () => boolean;
  canGoBack: () => boolean;
};

export function makeGameHistory({
  locations,
  onChange,
}: {
  locations: GameLocation[];
  onChange?: (
    newLocations: GameLocation[],
    operation: "push" | "reset" | "back",
  ) => void;
}): GameHistory {
  let items = locations;

  return {
    peek: () => {
      const location = items.at(-1);
      if (location === undefined) {
        throw new Error("Game history has no location");
      }

      return location;
    },
    push: (location) => {
      items = [...items, location];
      onChange?.(items, "push");
    },
    reset: (location) => {
      items = [location];
      onChange?.(items, "reset");
    },
    goBack: () => {
      if (items.length > 1) {
        items = items.slice(0, -1);
        onChange?.(items, "back");
        return true;
      }

      return false;
    },
    canGoBack: () => items.length > 1,
  };
}
