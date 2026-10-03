import type { SoundName } from "#contexts/index.ts";
import {
  BranchProvider,
  GameProvider,
  useGameContext,
} from "#contexts/index.ts";
import type { Result } from "#lib/index.ts";
import { usePreloadAssets } from "#lib/index.ts";
import type { Branches, BranchId } from "#types.ts";
import {
  ArrowCounterClockwiseIcon,
  ArrowLeftIcon,
  HouseIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react";
import type { ComponentType, MouseEvent, ReactNode } from "react";
import { useMemo } from "react";

export type GameProps = {
  assets: Record<
    string,
    | string
    | {
        src: string;
      }
  >;
  branches: Branches & Record<string, ComponentType>;
  initialBranchId: BranchId;
  // oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional callback contract.
  onLinkClick?: (href: string, name: string, event: MouseEvent) => void;
  onPlaySound?: (name: SoundName) => void;
  onGoHome?: () => void;
  // oxlint-disable-next-line utilfirst/prefer-options-parameter -- Preserve the published positional callback contract.
  children?: (
    render: () => ReactNode,
    preloadRes: Result<Error, undefined>,
    preloadProgress: number,
  ) => ReactNode;
};

export function Game(props: GameProps) {
  const branchIds = useMemo(
    () => Object.keys(props.branches),
    [props.branches],
  );

  return (
    <GameProvider
      initialBranchId={props.initialBranchId}
      branchIds={branchIds}
      onLinkClick={props.onLinkClick}
      onPlaySound={props.onPlaySound}
      onGoHome={props.onGoHome}
    >
      <GameView
        assets={props.assets}
        branches={props.branches}
        initialBranchId={props.initialBranchId}
      >
        {props.children}
      </GameView>
    </GameProvider>
  );
}

type GameViewProps = Pick<
  GameProps,
  "assets" | "branches" | "initialBranchId" | "children"
>;

function GameView(props: GameViewProps) {
  const children = props.children ?? renderGame;

  const {
    focusedLocation,
    muted,
    setMuted,
    paused,
    setPaused,
    goToLocation,
    goBack,
    canGoBack,
    goHome,
    playSound,
  } = useGameContext();

  const [preloadRes, preloadProgress] = usePreloadAssets(props.assets);

  const isPreloaded = preloadRes.status === "success";

  return (
    <>
      <div className="absolute z-[120] flex w-full p-4">
        <div className="flex flex-1 gap-2">
          {isPreloaded && canGoBack() && (
            <button
              type="button"
              aria-label="Previous statement"
              onMouseEnter={() => {
                playSound("mouseover");
              }}
              onClick={() => {
                playSound("click");
                goBack();
              }}
              className="rvn-icon-button"
            >
              <ArrowLeftIcon />
            </button>
          )}
        </div>

        <div className="flex flex-1 justify-end gap-2">
          {isPreloaded && (
            <button
              type="button"
              aria-label="Restart game"
              onMouseEnter={() => {
                playSound("mouseover");
              }}
              onClick={() => {
                playSound("click");
                goToLocation(props.initialBranchId, 0);
              }}
              className="rvn-icon-button"
            >
              <ArrowCounterClockwiseIcon />
            </button>
          )}

          {goHome && (
            <button
              type="button"
              aria-label="Go home"
              onMouseEnter={() => {
                playSound("mouseover");
              }}
              onClick={() => {
                playSound("click");
                goHome();
              }}
              className="rvn-icon-button"
            >
              <HouseIcon />
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-4 bottom-4 z-[120] flex gap-2">
        {isPreloaded && (
          <>
            <button
              type="button"
              aria-label={muted ? "Unmute audio" : "Mute audio"}
              aria-pressed={muted}
              onMouseEnter={() => {
                playSound("mouseover");
              }}
              onClick={() => {
                playSound("click");
                setMuted(!muted);
              }}
              className="rvn-icon-button"
            >
              {muted ? <SpeakerSlashIcon /> : <SpeakerHighIcon />}
            </button>

            <button
              type="button"
              aria-label={paused ? "Resume playback" : "Pause playback"}
              aria-pressed={paused}
              onMouseEnter={() => {
                playSound("mouseover");
              }}
              onClick={() => {
                playSound("click");
                setPaused(!paused);
              }}
              className="rvn-icon-button"
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
          </>
        )}
      </div>

      {children(
        () => (
          <div className="flex h-full w-full overflow-hidden">
            {Object.entries(props.branches).map(
              ([branchId, BranchComp]) =>
                branchId === focusedLocation.branchId && (
                  <BranchProvider
                    key={branchId}
                    branchId={focusedLocation.branchId}
                  >
                    <BranchComp />
                  </BranchProvider>
                ),
            )}
          </div>
        ),
        preloadRes,
        preloadProgress,
      )}
    </>
  );
}

export function prepareBranches<
  TRawBranches extends Record<string, ComponentType>,
>(_branches: TRawBranches) {
  const entries = Object.fromEntries(
    Object.entries(_branches)
      .filter(([exportName]) => exportName.startsWith("Branch"))
      .map(([exportName, exportVal]) => [
        exportName.replace(BRANCH_PREFIX_RE, ""),
        exportVal,
      ]),
  );

  // SAFETY: The filter keeps Branch-prefixed names and the mapping strips only that prefix, preserving each component value.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Object.fromEntries cannot retain the mapped key relationship.
  const branches = entries as {
    [
      K in keyof typeof _branches as K extends `Branch${infer TId}`
        ? TId
        : never
    ]: (typeof _branches)[K];
  };

  return branches;
}

function renderGame(render: () => ReactNode) {
  return render();
}

const BRANCH_PREFIX_RE = /^Branch/u;
