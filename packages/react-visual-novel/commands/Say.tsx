import type {
  Choice,
  ImageViewProps,
  MenuViewProps,
  TextViewProps,
} from "#commands/views/index.ts";
import {
  charGroupsForMarkdown,
  ImageView,
  MenuView,
  TextView,
} from "#commands/views/index.ts";
import type { CommandProps } from "#components/index.ts";
import { Command } from "#components/index.ts";
import type { StatementBehavior } from "#contexts/index.ts";
import { motion } from "framer-motion";
import React from "react";
import dedent from "string-dedent";
import { twMerge } from "tailwind-merge";

export type SayProps = Pick<
  CommandProps,
  "audio" | "hide" | "next" | "zIndex"
> &
  Omit<TextViewProps, "groups" | "controls"> & {
    children: string;
    image?: string | Omit<ImageViewProps, "controls">;
    menu?: Choice[] | Omit<MenuViewProps, "controls">;
    durationMs?: number;
    scrim?: boolean;
  };

export function Say(props: SayProps) {
  const {
    children,
    placement,
    scheme,
    image,
    menu,
    durationMs,
    scrim,
    audio,
    hide,
    next,
    zIndex,
    ...textProps
  } = props;

  let text: string;
  try {
    text = dedent(children);
  } catch {
    text = children;
  }

  const groups = React.useMemo(() => charGroupsForMarkdown(text), [text]);
  const length = groups.flatMap((g) => g.chars).length;
  const imageProps = typeof image === "string" ? { uri: image } : image;

  const menuProps =
    typeof menu === "object" && Array.isArray(menu) ? { choices: menu } : menu;

  let behavior: StatementBehavior;
  if (menuProps !== undefined) {
    behavior = ["non_skippable"];
  } else if (groups.some((g) => g.type === "link")) {
    behavior = ["skippable_static"];
  } else {
    behavior = [
      "skippable_timed",
      { durationMs: durationMs ?? 4000 + length * 25 },
    ];
  }

  return (
    <Command
      name="Say"
      behavior={behavior}
      audio={audio}
      hide={hide}
      next={next}
      zIndex={zIndex}
    >
      {(controls) => (
        <>
          {scrim && (
            <motion.div
              variants={{
                initial: { opacity: 0 },
                entrance: {
                  opacity: 1,
                  transition: { duration: 1 },
                },
                exit: {
                  opacity: 0,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              initial="initial"
              animate={controls}
              className={twMerge(
                "absolute inset-0",
                {
                  top: scheme === "dark" ? "scrim-t-3/4" : "scrim-t-3/4-light",
                  middle:
                    scheme === "dark" ? "scrim-t-3/4" : "scrim-t-3/4-light",
                  bottom:
                    scheme === "dark" ? "scrim-b-3/4" : "scrim-b-3/4-light",
                }[placement ?? "top"],
              )}
            />
          )}

          {imageProps && <ImageView controls={controls} {...imageProps} />}

          <TextView
            groups={groups}
            placement={placement}
            scheme={scheme}
            controls={controls}
            {...textProps}
          />

          {menuProps && (
            <MenuView
              placement={placement === "bottom" ? "top" : "bottom"}
              scheme={scheme}
              controls={controls}
              {...menuProps}
            />
          )}
        </>
      )}
    </Command>
  );
}
