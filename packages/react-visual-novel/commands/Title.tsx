import type { CommandProps } from "#components/Command.tsx";
import { Command } from "#components/Command.tsx";
import { motion } from "framer-motion";

export type TitleProps = Pick<CommandProps, "hide"> & {
  children: string;
  durationMs?: number;
};

export function Title(props: TitleProps) {
  const durationMs = props.durationMs ?? 4000;

  return (
    <Command
      name="Title"
      behavior={["skippable_timed", { durationMs }]}
      hide={props.hide}
    >
      {(controls) => (
        <div className="flex flex-1 flex-col justify-center p-8">
          <motion.span
            variants={{
              initial: { opacity: 0 },
              entrance: {
                opacity: 1,
                transition: { duration: 4 },
              },
              exit: {
                opacity: 0,
                transition: { duration: 0.5, ease: "easeOut" },
              },
            }}
            initial="initial"
            animate={controls}
            className="rvn-title"
          >
            {props.children}
          </motion.span>
        </div>
      )}
    </Command>
  );
}
