import type {
  CommandViewAnimation,
  CommandViewColorScheme,
} from "#components/index.ts";
import { useBranchContext, useGameContext } from "#contexts/index.ts";
import type { BranchId } from "#types.ts";
import type { AnimationControls } from "framer-motion";
import { motion } from "framer-motion";
import React from "react";
import { twMerge } from "tailwind-merge";
import type { Frame } from "./frame.ts";
import { styleForFrame } from "./frame.ts";

type MenuContext = {
  goToBranch: (branchId: BranchId) => void;
  goToStatement: (statementLabel: string) => void;
  goToLocation: (branchId: BranchId, statementIndex: number) => void;
  goToNextStatement: (plusIndex?: number) => void;
};

export type Choice = {
  label: string;
  frame?: Frame;
  onClick: (ctx: MenuContext) => void;
};

export type MenuSize = "md" | "lg";
export type MenuPlacement = "top" | "middle" | "bottom";

export type MenuViewProps = {
  choices: Choice[];
  label?: string;
  size?: MenuSize;
  placement?: MenuPlacement;
  style?: React.CSSProperties;
  scheme?: CommandViewColorScheme;
  controls: AnimationControls;
};

export function MenuView(props: MenuViewProps) {
  const { label, scheme } = props;
  const size = props.size ?? "md";
  const placement = props.placement ?? "bottom";

  const { goToBranch, goToLocation, playSound } = useGameContext();

  const { containerRect, goToStatement, goToNextStatement } =
    useBranchContext();

  const ctx = React.useMemo(
    (): MenuContext => ({
      goToBranch,
      goToLocation,
      goToStatement,
      goToNextStatement,
    }),
    [goToBranch, goToLocation, goToStatement, goToNextStatement],
  );

  return (
    <div
      className={twMerge(
        "pointer-events-none absolute inset-0 flex flex-col p-8 py-20",
        {
          top: "justify-start",
          middle: "justify-center",
          bottom: "justify-end",
        }[placement],
      )}
      style={props.style}
    >
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        {label !== undefined && label !== "" && (
          <div className="flex pb-2">
            <motion.span
              variants={itemAnimation}
              initial="initial"
              animate={props.controls}
              custom={0}
              data-scheme={scheme}
              className="rvn-menu-label whitespace-pre-wrap"
            >
              {label}
            </motion.span>
          </div>
        )}

        {props.choices.map((c, idx) => (
          <motion.div
            key={c.label}
            variants={itemAnimation}
            initial="initial"
            animate={props.controls}
            custom={idx + 1}
            className="flex flex-col"
          >
            {c.frame ? (
              <motion.button
                type="button"
                aria-label={c.label}
                animate={{ opacity: 0 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 1,
                  ease: "easeInOut",
                }}
                onMouseEnter={() => {
                  playSound("mouseover");
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  playSound("click");
                  c.onClick(ctx);
                }}
                data-scheme={scheme}
                className="rvn-menu-item-surface"
                style={styleForFrame({ containerRect }, c.frame)}
              />
            ) : (
              <button
                type="button"
                onMouseEnter={() => {
                  playSound("mouseover");
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  playSound("click");
                  c.onClick(ctx);
                }}
                data-size={size}
                data-scheme={scheme}
                className="rvn-menu-item-button"
                style={{ animationDelay: `calc(0.05 * ${idx}s)` }}
              >
                {c.label}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const itemAnimation: CommandViewAnimation = {
  initial: { opacity: 0 },
  entrance: (idx) => ({
    opacity: 1,
    transition: { delay: 0.5 + 0.25 * idx },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
