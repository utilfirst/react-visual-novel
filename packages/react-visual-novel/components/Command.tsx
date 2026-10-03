import type { Statement, StatementBehavior } from "#contexts/index.ts";
import {
  useBranchContext,
  useGameContext,
  useStatementContext,
} from "#contexts/index.ts";
import type { AudioSource } from "#lib/index.ts";
import { useAudio, useWindowFocus } from "#lib/index.ts";
import {
  useIsMounted,
  useMountEffect,
  useSyncedRef,
  useUnmountEffect,
  useUpdateEffect,
} from "@react-hookz/web";
import type { AnimationControls, Variant } from "framer-motion";
import {
  AnimatePresence,
  motion,
  useAnimation,
  usePresence,
} from "framer-motion";
import React from "react";
import { twMerge } from "tailwind-merge";
import useEventCallback from "use-event-callback";

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
  children: (controls: AnimationControls) => React.ReactNode;
  behavior?: StatementBehavior;
  audio?: CommandAudioConfig;
  hide?: number | ((statement: Statement) => boolean);
  next?: number | string;
  zIndex?: number | "auto";
};

const defaultBehavior: StatementBehavior = ["skippable_static"];

export function Command(props: CommandProps) {
  const { audio: audioSrc } = props;
  const behavior = props.behavior ?? defaultBehavior;
  const hide = props.hide ?? 0;
  const next = props.next ?? 1;
  const zIndex = props.zIndex ?? "auto";

  const { register, visible } = useStatementContext();

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

  const visibleRef = useSyncedRef(visible);

  const mountedRef = React.useRef(false);
  const handledStateRef = React.useRef<"visible" | "hidden">("hidden");
  const playControllerRef = React.useRef<AbortController | null>(null);

  const handleVisible = useEventCallback(async () => {
    if (handledStateRef.current === "visible") {
      return;
    }

    handledStateRef.current = "visible";

    const controller = new AbortController();

    playControllerRef.current?.abort();
    playControllerRef.current = controller;

    void onExitAudio?.stop().catch(reportAudioError);
    if (onEntranceAudio) {
      if (whileVisibleAudio?.src.overlap) {
        void onEntranceAudio.play().catch(reportAudioError);
      } else {
        await onEntranceAudio.play();

        if (
          !visibleRef.current ||
          !mountedRef.current ||
          controller.signal.aborted
        ) {
          return;
        }
      }
    }

    void whileVisibleAudio?.play().catch(reportAudioError);
  });

  const handleHidden = useEventCallback(async () => {
    if (handledStateRef.current === "hidden") {
      return;
    }

    handledStateRef.current = "hidden";

    const controller = new AbortController();

    playControllerRef.current?.abort();
    playControllerRef.current = controller;

    void onEntranceAudio?.stop().catch(reportAudioError);
    if (whileVisibleAudio) {
      if (whileVisibleAudio.src.overlap === true) {
        void whileVisibleAudio.stop().catch(reportAudioError);
      } else {
        await whileVisibleAudio.stop();

        if (
          visibleRef.current ||
          mountedRef.current ||
          controller.signal.aborted
        ) {
          return;
        }
      }
    }

    await onExitAudio?.play();
  });

  useMountEffect(() => {
    if (mountedRef.current) {
      return;
    }

    mountedRef.current = true;
    setTimeout(() => {
      setTimeout(() => {
        if (!visibleRef.current || !mountedRef.current) {
          return;
        }

        void handleVisible().catch(reportAudioError);
      }, 0);
    }, 0);
  });

  useUnmountEffect(() => {
    if (!mountedRef.current) {
      return;
    }

    mountedRef.current = false;
    setTimeout(() => {
      if (mountedRef.current) {
        return;
      }

      void handleHidden().catch(reportAudioError);
    }, 0);
  });

  useUpdateEffect(() => {
    if (visible) {
      setTimeout(() => {
        setTimeout(() => {
          if (!visibleRef.current || !mountedRef.current) {
            return;
          }

          void handleVisible().catch(reportAudioError);
        }, 0);
      }, 0);
    } else {
      setTimeout(() => {
        if (visibleRef.current || !mountedRef.current) {
          return;
        }

        void handleHidden().catch(reportAudioError);
      }, 0);
    }
  }, [visible, visibleRef, mountedRef, handleVisible, handleHidden]);

  return (
    <AnimatePresence>
      {visible && (
        <CommandView ref={viewRef} behavior={behavior} zIndex={zIndex}>
          {props.children}
        </CommandView>
      )}
    </AnimatePresence>
  );
}

type CommandViewProps = {
  children: (controls: AnimationControls) => React.ReactNode;
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

  const { paused: gamePaused } = useGameContext();
  const { goToNextStatement } = useBranchContext();
  const { statementIndex, focused } = useStatementContext();
  const [isPresent, safeToRemove] = usePresence();
  const isMounted = useIsMounted();
  const windowFocused = useWindowFocus();

  const enteredRef = React.useRef(false);

  const [entered, setEntered] = React.useState(false);

  const setCommandEntered = React.useCallback((newEntered: boolean) => {
    enteredRef.current = newEntered;
    setEntered(newEntered);
  }, []);

  const controls = useAnimation();

  const [countdownProgress, setCountdownProgress] = React.useState(0);

  const countdownTimerRef = React.useRef<ReturnType<typeof setInterval>>();
  const countdownPausedRef = React.useRef(false);

  const gamePausedRef = useSyncedRef(gamePaused);
  const windowFocusedRef = useSyncedRef(windowFocused);

  const countdownDuration =
    behavior[0] === "skippable_timed" ? behavior[1].durationMs : null;

  const completeExit = useEventCallback(() => {
    safeToRemove?.();
  });

  React.useImperativeHandle(
    forwardedRef,
    (): CommandViewInstance => ({
      enter: () => {
        if (enteredRef.current) {
          return false;
        }

        controls.stop();
        controls.set("entrance");
        setCommandEntered(true);
        return true;
      },
      pause: () => {
        countdownPausedRef.current = true;
      },
      resume: () => {
        countdownPausedRef.current = false;
      },
    }),
    [controls, setCommandEntered],
  );

  React.useEffect(() => {
    let active = true;
    let entranceFrame: number | undefined;
    let deferredFrame: number | undefined;
    if (isPresent) {
      setCommandEntered(false);
      entranceFrame = requestAnimationFrame(() => {
        deferredFrame = requestAnimationFrame(() => {
          void controls
            .start("entrance")
            .then(() => {
              if (active) {
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
          if (active) {
            completeExit();
          }

          return undefined;
        })
        .catch(reportAnimationError);
    }

    return () => {
      active = false;
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
    if (countdownDuration !== null && entered && focused) {
      setCountdownProgress(0);
      countdownTimerRef.current = setInterval(() => {
        if (
          countdownPausedRef.current ||
          gamePausedRef.current ||
          !windowFocusedRef.current
        ) {
          return;
        }

        if (isMounted()) {
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
    entered,
    focused,
    countdownDuration,
    gamePausedRef,
    windowFocusedRef,
    isMounted,
  ]);

  React.useEffect(() => {
    if (countdownProgress === 100) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = undefined;
      }
      if (focused) {
        goToNextStatement();
      }
    }
  }, [countdownProgress, focused, goToNextStatement]);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        zIndex: props.zIndex === "auto" ? statementIndex : props.zIndex,
      }}
    >
      <AnimatePresence>
        {behavior[0] === "skippable_timed" && focused && (
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
