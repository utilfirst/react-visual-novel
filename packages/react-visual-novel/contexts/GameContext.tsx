import type { GameHistory, GameLocation } from "#contexts/internal/index.ts";
import {
  makeGameHistory,
  makeGameLocationId,
  parseGameLocation,
} from "#contexts/internal/index.ts";
import { unmute } from "#contexts/internal/vendor/unmute.js";
import type { BranchId } from "#types.ts";
import { useLocalStorageValue, useUpdateEffect } from "@react-hookz/web";
import { Howler } from "howler";
import React from "react";
import useEventCallback from "use-event-callback";
import { StringParam, useQueryParam, withDefault } from "use-query-params";

export type SoundName = "click" | "mouseover" | "skip" | "not_allowed";

export type GameOptions = {
  // oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional callback contract.
  onLinkClick?: (href: string, name: string, event: React.MouseEvent) => void;
  onPlaySound?: (name: SoundName) => void;
  onGoHome?: () => void;
};

export type GameContextValue = {
  focusedLocation: GameLocation;
  muted: boolean;
  setMuted: React.Dispatch<boolean>;
  paused: boolean;
  setPaused: React.Dispatch<boolean>;
  goToBranch: (branchId: BranchId) => void;
  goToLocation: (branchId: BranchId, statementIndex: number) => void;
  goBack: () => boolean;
  canGoBack: () => boolean;
  goHome?: () => void;
  // oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional callback contract.
  handleLinkClick: (
    href: string,
    name: string,
    event: React.MouseEvent,
  ) => void;
  playSound: (name: SoundName) => void;
};

const GameContext = React.createContext<GameContextValue | null>(null);

export type GameProviderProps = {
  children: React.ReactNode;
  initialBranchId: BranchId;
  // oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional callback contract.
  onLinkClick?: (href: string, name: string, event: React.MouseEvent) => void;
  onPlaySound?: (name: SoundName) => void;
  onGoHome?: () => void;
};

export function GameProvider(props: GameProviderProps) {
  const initialLocation: GameLocation = {
    branchId: props.initialBranchId,
    statementIndex: 0,
  };

  const [storedFocusedLocationId, setStoredFocusedLocationId] = useQueryParam(
    "location",
    withDefault(StringParam, makeGameLocationId(initialLocation)),
  );

  const [focusedLocation, setFocusedLocation] = React.useState(
    () => parseGameLocation(storedFocusedLocationId) ?? initialLocation,
  );

  const [muted, setMuted] = React.useState(false);

  const [paused, setPaused] = useLocalStorageValue(
    "@GameContext/paused",
    false,
  );

  const [locations, setLocations] = useLocalStorageValue<GameLocation[]>(
    "@GameContext/locations",
    [focusedLocation],
  );

  const historyRef = React.useRef<GameHistory | null>(null);
  historyRef.current ??= makeGameHistory({
    locations,
    onChange: (newLocations) => {
      setLocations(newLocations);

      const location = newLocations.at(-1);
      if (location === undefined) {
        throw new Error("Game history has no location");
      }

      setFocusedLocation(location);
    },
  });

  const history = historyRef.current;

  React.useEffect(() => {
    // Howler creates its AudioContext when mute is first called.
    Howler.mute(false);

    // Keep the playback unlock listener mounted across mute toggles.
    const handle = unmute(Howler.ctx, false, false);

    return () => {
      handle.dispose();
    };
  }, []);

  React.useEffect(() => {
    Howler.mute(muted);
  }, [muted]);

  const writeQueryLocation = useEventCallback(() => {
    setStoredFocusedLocationId(makeGameLocationId(focusedLocation));
  });

  useUpdateEffect(() => {
    writeQueryLocation();
  }, [focusedLocation, writeQueryLocation]);

  const restoreQueryLocation = useEventCallback(() => {
    const storedFocusedLocation = parseGameLocation(storedFocusedLocationId);
    if (
      storedFocusedLocation &&
      (storedFocusedLocation.branchId !== focusedLocation.branchId ||
        storedFocusedLocation.statementIndex !== focusedLocation.statementIndex)
    ) {
      history.reset(storedFocusedLocation);
    }
  });

  useUpdateEffect(() => {
    restoreQueryLocation();
  }, [storedFocusedLocationId, restoreQueryLocation]);

  const playSound = useEventCallback((name: SoundName) => {
    if (!muted) {
      props.onPlaySound?.(name);
    }
  });

  const ctx = React.useMemo(
    (): GameContextValue => ({
      focusedLocation,
      muted,
      setMuted,
      paused,
      setPaused,
      goToBranch: (branchId) => {
        if (branchId !== focusedLocation.branchId) {
          history.push({ branchId, statementIndex: 0 });
        }
      },
      goToLocation: (branchId, statementIndex) => {
        if (
          branchId !== focusedLocation.branchId ||
          statementIndex !== focusedLocation.statementIndex
        ) {
          history.push({ branchId, statementIndex });
        }
      },
      goBack: () => {
        const ok = history.goBack();
        if (ok) {
          setPaused(true);
        }

        return ok;
      },
      canGoBack: history.canGoBack,
      goHome: props.onGoHome,
      handleLinkClick:
        props.onLinkClick ??
        ((href) => {
          window.open(href, "_blank");
        }),
      playSound,
    }),
    [
      focusedLocation,
      history,
      muted,
      props.onGoHome,
      props.onLinkClick,
      playSound,
      paused,
      setMuted,
      setPaused,
    ],
  );

  return (
    <GameContext.Provider value={ctx}>{props.children}</GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = React.useContext(GameContext);
  if (!ctx) {
    throw new Error(
      "`useGameContext` can only be used inside a Game component",
    );
  }

  return ctx;
}
