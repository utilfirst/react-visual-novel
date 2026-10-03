import { GameHistoryContext } from "#contexts/internal/game-history-context.ts";
import type { GameHistory } from "#contexts/internal/game-history.ts";
import { makeGameHistory } from "#contexts/internal/game-history.ts";
import type { GameLocation } from "#contexts/internal/game-location.ts";
import {
  decodeGameLocations,
  makeGameLocationId,
  parseGameLocation,
} from "#contexts/internal/game-location.ts";
import {
  readGameLocationId,
  useGameLocationId,
  writeGameLocationId,
} from "#contexts/internal/game-url.ts";
import { unmute } from "#contexts/internal/vendor/unmute.js";
import { useEventCallback } from "#lib/use-event-callback.ts";
import {
  readPersistentState,
  usePersistentState,
  writePersistentState,
} from "#lib/use-persistent-state.ts";
import type { BranchId } from "#types.ts";
import { Howler } from "howler";
import type { Dispatch, MouseEvent, ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SoundName = "click" | "mouseover" | "skip" | "not_allowed";

export type GameOptions = {
  // oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional callback contract.
  onLinkClick?: (href: string, name: string, event: MouseEvent) => void;
  onPlaySound?: (name: SoundName) => void;
  onGoHome?: () => void;
};

export type GameContextValue = {
  focusedLocation: GameLocation;
  muted: boolean;
  setMuted: Dispatch<boolean>;
  paused: boolean;
  setPaused: Dispatch<boolean>;
  goToBranch: (branchId: BranchId) => void;
  goToLocation: (branchId: BranchId, statementIndex: number) => void;
  goBack: () => boolean;
  canGoBack: () => boolean;
  goHome?: () => void;
  // oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional callback contract.
  handleLinkClick: (href: string, name: string, event: MouseEvent) => void;
  playSound: (name: SoundName) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export type GameProviderProps = GameOptions & {
  children: ReactNode;
  initialBranchId: BranchId;
  branchIds?: readonly string[];
};

export function GameProvider(props: GameProviderProps) {
  const initialLocation: GameLocation = {
    branchId: props.initialBranchId,
    statementIndex: 0,
  };

  if (
    props.branchIds !== undefined &&
    !props.branchIds.includes(props.initialBranchId)
  ) {
    throw new Error(`Unknown initial branch: ${String(props.initialBranchId)}`);
  }

  const [storedFocusedLocationId, setStoredFocusedLocationId] =
    useGameLocationId(makeGameLocationId(initialLocation));

  const [focusedLocation, setFocusedLocation] = useState(() =>
    resolveGameLocation({
      location: parseGameLocation(storedFocusedLocationId),
      initialLocation,
      branchIds: props.branchIds,
    }),
  );

  const [muted, setMuted] = useState(false);

  const [paused, setPaused] = usePersistentState({
    key: "@GameContext/paused",
    initialValue: false,
    decode: decodePaused,
  });

  const historyRef = useRef<GameHistory | null>(null);

  if (historyRef.current === null) {
    // NOTE: History owns its mounted state. Storage is an initial snapshot
    // and a persistence target, not a second reactive history owner.
    const locations = readPersistentState({
      key: "@GameContext/locations",
      initialValue: [focusedLocation],
      decode: (value) => {
        const decodedLocations = decodeGameLocations(value)?.filter(
          (location) =>
            props.branchIds === undefined ||
            props.branchIds.includes(location.branchId),
        );

        return decodedLocations !== undefined && decodedLocations.length > 0
          ? decodedLocations
          : null;
      },
    });

    const lastLocation = locations.at(-1);
    historyRef.current = makeGameHistory({
      locations:
        lastLocation !== undefined &&
        makeGameLocationId(lastLocation) === makeGameLocationId(focusedLocation)
          ? locations
          : [focusedLocation],
      onChange: (newLocations, operation) => {
        writePersistentState({
          key: "@GameContext/locations",
          value: newLocations,
        });

        const location = newLocations.at(-1);
        if (location === undefined) {
          throw new Error("Game history has no location");
        }

        setFocusedLocation(location);

        // NOTE: Write at the navigation owner. An effect tied to render state
        // can overwrite a newer browser navigation or statement-bound recovery.
        setStoredFocusedLocationId({
          locationId: makeGameLocationId(location),
          replace: operation === "reset",
        });
      },
    });
  }

  const history = historyRef.current;

  const restoreQueryLocation = useEventCallback(() => {
    // NOTE: A child can repair bounds before this effect runs. Read the URL
    // at execution time and compare against the synchronous history owner.
    // Render snapshots can lag behind a newer navigation.
    const parsedLocation = parseGameLocation(
      readGameLocationId() ?? makeGameLocationId(initialLocation),
    );

    const location = resolveGameLocation({
      location: parsedLocation,
      initialLocation,
      branchIds: props.branchIds,
    });

    // NOTE: Repair malformed URLs in place so browser back does not retain
    // a destination that the game cannot render.
    if (
      parsedLocation === null ||
      makeGameLocationId(location) !== makeGameLocationId(parsedLocation)
    ) {
      writeGameLocationId({
        locationId: makeGameLocationId(location),
        replace: true,
      });
    }
    if (makeGameLocationId(location) !== makeGameLocationId(history.peek())) {
      history.reset(location);
    }
  });

  const playSound = useEventCallback((name: SoundName) => {
    if (!muted) {
      props.onPlaySound?.(name);
    }
  });

  const ctx = useMemo(
    (): GameContextValue => ({
      focusedLocation,
      muted,
      setMuted,
      paused,
      setPaused,
      goToBranch: (branchId) => {
        if (branchId !== history.peek().branchId) {
          history.push({ branchId, statementIndex: 0 });
        }
      },
      goToLocation: (branchId, statementIndex) => {
        // NOTE: Earlier calls can move history before React renders again.
        const currentLocation = history.peek();
        if (
          branchId !== currentLocation.branchId ||
          statementIndex !== currentLocation.statementIndex
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
      handleLinkClick: props.onLinkClick ?? openGameLink,
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

  useEffect(() => {
    // Howler creates its AudioContext when mute is first called.
    Howler.mute(false);

    // Keep the playback unlock listener mounted across mute toggles.
    const handle = unmute(Howler.ctx, false, false);

    return () => {
      handle.dispose();
    };
  }, []);

  useEffect(() => {
    Howler.mute(muted);
  }, [muted]);

  useEffect(() => {
    restoreQueryLocation();
  }, [storedFocusedLocationId, props.branchIds, restoreQueryLocation]);

  return (
    <GameContext.Provider value={ctx}>
      <GameHistoryContext.Provider value={history}>
        {props.children}
      </GameHistoryContext.Provider>
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = useContext(GameContext);

  if (!ctx) {
    throw new Error(
      "`useGameContext` can only be used inside a Game component",
    );
  }

  return ctx;
}

function decodePaused(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

type ResolveGameLocationOptions = {
  location: GameLocation | null;
  initialLocation: GameLocation;
  branchIds?: readonly string[];
};

function resolveGameLocation(
  options: ResolveGameLocationOptions,
): GameLocation {
  const location = options.location;
  if (
    location === null ||
    !Number.isSafeInteger(location.statementIndex) ||
    location.statementIndex < 0 ||
    (options.branchIds !== undefined &&
      !options.branchIds.includes(location.branchId))
  ) {
    return options.initialLocation;
  }

  return location;
}

// oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional link callback contract.
function openGameLink(href: string, _name: string, event: MouseEvent) {
  event.preventDefault();
  window.open(href, "_blank", "noopener,noreferrer");
}
