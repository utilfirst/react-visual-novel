import type { Statement, StatementBehavior } from "#contexts/index.ts";
import {
  useBranchContext,
  useGameContext,
  useStatementContext,
} from "#contexts/index.ts";
import type { AudioPlayer, AudioSource } from "#lib/index.ts";
import { useAudio, useWindowFocus } from "#lib/index.ts";
import { useEventCallback } from "#lib/use-event-callback.ts";
import { useSyncedRef } from "#lib/use-synced-ref.ts";
import { useUpdateEffect } from "#lib/use-update-effect.ts";
import type { Variant } from "framer-motion";
import {
  AnimatePresence,
  motion,
  useAnimation,
  usePresence,
} from "framer-motion";
import React from "react";
import { twMerge } from "tailwind-merge";

export type CommandViewColorScheme = "default" | "dark";

export type CommandViewAnimation = {
  initial: Variant;
  entrance: Variant;
  exit: Variant;
};

export type CommandAudioConfig = {
  whileVisible?: string | AudioSource;
  onEntrance?: string;
  onExit?: string;
};

export type CommandProps = {
  name: string;
  children: (controls: ReturnType<typeof useAnimation>) => React.ReactNode;
  behavior?: StatementBehavior;
  audio?: CommandAudioConfig;
  hide?: number | ((statement: Statement) => boolean);
  next?: number | string;
  zIndex?: number | "auto";
};

const defaultBehavior: StatementBehavior = ["skippable_static"];

type CommandAudioOperation = {
  controller: AbortController;
  main: AudioPlayer | null;
} & (
  | {
      state: "visible";
      entrance: AudioPlayer | null;
      isMainReady: boolean;
    }
  | {
      state: "hidden";
      exit: AudioPlayer | null;
    }
);

export function Command(props: CommandProps) {
  const { audio: audioSrc } = props;
  const behavior = props.behavior ?? defaultBehavior;
  const hide = props.hide ?? 0;
  const next = props.next ?? 1;
  const zIndex = props.zIndex ?? "auto";

  const { register, visible: isVisible } = useStatementContext();

  const viewRef = React.useRef<CommandViewInstance>(null);
  React.useEffect(
    () =>
      register({
        command: props.name,
        behavior,
        hide,
        next,
        enter: () => viewRef.current?.enter() ?? false,
        pause: () => viewRef.current?.pause(),
        resume: () => viewRef.current?.resume(),
      }),
    [behavior, props.name, hide, next, register],
  );

  const whileVisibleAudio = useAudio(
    audioSrc?.whileVisible !== undefined && audioSrc.whileVisible !== ""
      ? {
          channel: "main",
          ...(typeof audioSrc.whileVisible === "object"
            ? audioSrc.whileVisible
            : { uri: audioSrc.whileVisible }),
        }
      : null,
  );

  const onEntranceAudio = useAudio(
    audioSrc?.onEntrance !== undefined && audioSrc.onEntrance !== ""
      ? { uri: audioSrc.onEntrance, channel: "entrance" }
      : null,
  );

  const onExitAudio = useAudio(
    audioSrc?.onExit !== undefined && audioSrc.onExit !== ""
      ? { uri: audioSrc.onExit, channel: "exit" }
      : null,
  );

  const isVisibleRef = useSyncedRef(isVisible);

  const isMountedRef = React.useRef(false);
  const audioOperationRef = React.useRef<CommandAudioOperation | null>(null);

  const handleVisible = useEventCallback(async () => {
    const previous = audioOperationRef.current;
    if (previous?.state === "visible") {
      return;
    }

    const operation: CommandAudioOperation = {
      state: "visible",
      controller: new AbortController(),
      main: whileVisibleAudio,
      entrance: onEntranceAudio,
      isMainReady: false,
    };

    previous?.controller.abort();
    audioOperationRef.current = operation;

    const previousExit = previous?.exit ?? onExitAudio;
    void previousExit?.stop().catch(reportAudioError);
    if (operation.entrance) {
      if (operation.main?.src.overlap) {
        void operation.entrance.play().catch(reportAudioError);
      } else {
        await operation.entrance.play();

        if (
          !isVisibleRef.current ||
          !isMountedRef.current ||
          operation.controller.signal.aborted
        ) {
          return;
        }
      }
    }

    operation.isMainReady = true;
    void operation.main?.play().catch(reportAudioError);
  });

  const handleHidden = useEventCallback(async () => {
    const previous = audioOperationRef.current;
    if (previous === null || previous.state === "hidden") {
      return;
    }

    const operation: CommandAudioOperation = {
      state: "hidden",
      controller: new AbortController(),
      main: previous.main,
      exit: onExitAudio,
    };

    previous.controller.abort();
    audioOperationRef.current = operation;

    void previous.entrance?.stop().catch(reportAudioError);
    if (operation.main) {
      if (operation.main.src.overlap === true) {
        void operation.main.stop().catch(reportAudioError);
      } else {
        await operation.main.stop();

        if (
          (isMountedRef.current && isVisibleRef.current) ||
          operation.controller.signal.aborted
        ) {
          return;
        }
      }
    }

    await operation.exit?.play();
  });

  React.useEffect(() => {
    const operation = audioOperationRef.current;
    if (
      operation?.state !== "visible" ||
      !isVisibleRef.current ||
      operation.main === whileVisibleAudio
    ) {
      return;
    }

    const previousMain = operation.main;

    operation.main = whileVisibleAudio;

    // NOTE: Main sources follow committed props. A pending entrance keeps
    // its original sound and starts the latest main source when it finishes.
    if (operation.isMainReady) {
      void previousMain?.stop().catch(reportAudioError);
      void operation.main?.play().catch(reportAudioError);
    }
  }, [whileVisibleAudio, isVisibleRef]);

  React.useEffect(() => {
    isMountedRef.current = true;
    setTimeout(() => {
      setTimeout(() => {
        if (!isVisibleRef.current || !isMountedRef.current) {
          return;
        }

        void handleVisible().catch(reportAudioError);
      }, 0);
    }, 0);

    return () => {
      isMountedRef.current = false;
      setTimeout(() => {
        if (isMountedRef.current) {
          return;
        }

        void handleHidden().catch(reportAudioError);
      }, 0);
    };
  }, [handleVisible, handleHidden, isVisibleRef]);

  useUpdateEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setTimeout(() => {
          if (!isVisibleRef.current || !isMountedRef.current) {
            return;
          }

          void handleVisible().catch(reportAudioError);
        }, 0);
      }, 0);
    } else {
      setTimeout(() => {
        if (isVisibleRef.current || !isMountedRef.current) {
          return;
        }

        void handleHidden().catch(reportAudioError);
      }, 0);
    }
  }, [isVisible, isVisibleRef, isMountedRef, handleVisible, handleHidden]);

  return (
    <AnimatePresence>
      {isVisible && (
        <CommandView ref={viewRef} behavior={behavior} zIndex={zIndex}>
          {props.children}
        </CommandView>
      )}
    </AnimatePresence>
  );
}

type CommandViewProps = {
  children: (controls: ReturnType<typeof useAnimation>) => React.ReactNode;
  behavior: StatementBehavior;
  zIndex: "auto" | number;
};

type CommandViewInstance = {
  enter: () => boolean;
  pause: () => void;
  resume: () => void;
};

const CommandView = React.forwardRef(function CommandView(
  props: CommandViewProps,
  forwardedRef: React.ForwardedRef<CommandViewInstance>,
) {
  const { behavior } = props;

  const { paused: isGamePaused } = useGameContext();
  const { goToNextStatement } = useBranchContext();
  const { statementIndex, focused: isFocused } = useStatementContext();
  const [isPresent, safeToRemove] = usePresence();

  const isMountedRef = React.useRef(false);
  React.useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isWindowFocused = useWindowFocus();

  const isEnteredRef = React.useRef(false);

  const [isEntered, setIsEntered] = React.useState(false);

  const setCommandEntered = React.useCallback((isNextEntered: boolean) => {
    isEnteredRef.current = isNextEntered;
    setIsEntered(isNextEntered);
  }, []);

  const controls = useAnimation();

  const [countdownProgress, setCountdownProgress] = React.useState(0);

  const countdownTimerRef = React.useRef<
    ReturnType<typeof setInterval> | undefined
  >(undefined);

  const isCountdownPausedRef = React.useRef(false);

  const isGamePausedRef = useSyncedRef(isGamePaused);
  const isWindowFocusedRef = useSyncedRef(isWindowFocused);

  const countdownDuration =
    behavior[0] === "skippable_timed" ? behavior[1].durationMs : null;

  const completeExit = useEventCallback(() => {
    safeToRemove?.();
  });

  React.useImperativeHandle(
    forwardedRef,
    (): CommandViewInstance => ({
      enter: () => {
        if (isEnteredRef.current) {
          return false;
        }

        controls.stop();
        controls.set("entrance");
        setCommandEntered(true);
        return true;
      },
      pause: () => {
        isCountdownPausedRef.current = true;
      },
      resume: () => {
        isCountdownPausedRef.current = false;
      },
    }),
    [controls, setCommandEntered],
  );

  React.useEffect(() => {
    let isActive = true;
    let entranceFrame: number | undefined;
    let deferredFrame: number | undefined;
    if (isPresent) {
      setCommandEntered(false);
      entranceFrame = requestAnimationFrame(() => {
        deferredFrame = requestAnimationFrame(() => {
          void controls
            .start("entrance")
            .then(() => {
              if (isActive) {
                setCommandEntered(true);
              }

              return undefined;
            })
            .catch(reportAnimationError);
        });
      });
    } else {
      void controls
        .start("exit")
        .then(() => {
          if (isActive) {
            completeExit();
          }

          return undefined;
        })
        .catch(reportAnimationError);
    }

    return () => {
      isActive = false;
      if (entranceFrame !== undefined) {
        cancelAnimationFrame(entranceFrame);
      }
      if (deferredFrame !== undefined) {
        cancelAnimationFrame(deferredFrame);
      }

      controls.stop();
    };
  }, [isPresent, controls, completeExit, setCommandEntered]);

  React.useEffect(() => {
    if (countdownDuration !== null && isEntered && isFocused) {
      setCountdownProgress(0);
      countdownTimerRef.current = setInterval(() => {
        if (
          isCountdownPausedRef.current ||
          isGamePausedRef.current ||
          !isWindowFocusedRef.current
        ) {
          return;
        }

        if (isMountedRef.current) {
          setCountdownProgress((prev) => prev + 1);
        } else if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = undefined;
        }
      }, countdownDuration / 100);
    }

    return () => {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = undefined;
    };
  }, [
    isEntered,
    isFocused,
    countdownDuration,
    isGamePausedRef,
    isWindowFocusedRef,
    isMountedRef,
  ]);

  React.useEffect(() => {
    if (countdownProgress === 100) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = undefined;
      }
      if (isFocused) {
        goToNextStatement();
      }
    }
  }, [countdownProgress, isFocused, goToNextStatement]);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        zIndex: props.zIndex === "auto" ? statementIndex : props.zIndex,
      }}
    >
      <AnimatePresence>
        {behavior[0] === "skippable_timed" && isFocused && (
          <motion.progress
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            value={countdownProgress}
            max={100}
            className={twMerge(
              "absolute top-0 z-[100] h-2 w-full appearance-none rounded-none",
              "[&::-moz-progress-bar]:bg-gray-900",
              "[&::-webkit-progress-bar]:rounded-none [&::-webkit-progress-bar]:bg-gray-900/20",
              "[&::-webkit-progress-value]:rounded-none [&::-webkit-progress-value]:bg-gray-900",
            )}
          />
        )}
      </AnimatePresence>

      {props.children(controls)}
    </div>
  );
});

// oxlint-disable-next-line utilfirst/no-unknown-parameters -- Promise rejection callbacks receive arbitrary thrown values.
function reportAudioError(error: unknown) {
  console.error("Command audio failed", error);
}

// oxlint-disable-next-line utilfirst/no-unknown-parameters -- Promise rejection callbacks receive arbitrary thrown values.
function reportAnimationError(error: unknown) {
  console.error("Command animation failed", error);
}
