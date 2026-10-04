import { charGroupsForMarkdown } from "#commands/views/char-group.ts";
import type { ImageViewProps } from "#commands/views/ImageView.tsx";
import { ImageView } from "#commands/views/ImageView.tsx";
import type { Choice, MenuViewProps } from "#commands/views/MenuView.tsx";
import { MenuView } from "#commands/views/MenuView.tsx";
import type { TextViewProps } from "#commands/views/TextView.tsx";
import { TextView } from "#commands/views/TextView.tsx";
import type { CommandProps } from "#components/Command.tsx";
import { Command } from "#components/Command.tsx";
import type { StatementBehavior } from "#contexts/BranchContext.tsx";
import { motion } from "framer-motion";
import { useMemo } from "react";
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

  const text = dedentDialogue(children);

  const groups = useMemo(() => charGroupsForMarkdown(text), [text]);

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
          {scrim === true && (
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

          {imageProps !== undefined && (
            <ImageView controls={controls} {...imageProps} />
          )}

          <TextView
            groups={groups}
            placement={placement}
            scheme={scheme}
            controls={controls}
            {...textProps}
          />

          {menuProps !== undefined && (
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

function dedentDialogue(text: string): string {
  const segments = text.split(/(\n|\r\n?|\u2028|\u2029)/u);
  if (
    segments.length === 1 ||
    segments[0] !== "" ||
    /\S/u.test(segments.at(-1) ?? "")
  ) {
    return text;
  }

  // NOTE: Only multiline strings with empty opening and closing lines are
  // dedented. Preserve interior line endings and a shared whitespace prefix.
  let indentation: string | undefined;
  for (let index = 2; index < segments.length - 1; index += 2) {
    const line = segments[index] ?? "";
    const leading = /^\s*/u.exec(line)?.[0] ?? "";
    if (leading.length === line.length) {
      segments[index] = "";
      continue;
    }

    if (indentation === undefined) {
      indentation = leading;
    } else {
      let length = 0;
      while (
        length < indentation.length &&
        leading[length] === indentation[length]
      ) {
        length += 1;
      }

      indentation = indentation.slice(0, length);
    }
  }

  segments[1] = "";
  segments[segments.length - 2] = "";
  segments[segments.length - 1] = "";

  const indentationLength = indentation?.length ?? 0;

  return segments
    .map((segment, index) =>
      index % 2 === 0 ? segment.slice(indentationLength) : segment,
    )
    .join("");
}
