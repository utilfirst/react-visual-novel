import type { CommandAudioConfig } from "#components/Command.tsx";
import { Command } from "#components/Command.tsx";
import type { Statement } from "#contexts/BranchContext.tsx";

export type PlayProps = {
  audio?: CommandAudioConfig;
  hide?: number | ((statement: Statement) => boolean);
};

export function Play(props: PlayProps) {
  return (
    <Command
      name="Play"
      behavior={["skippable_timed", { durationMs: 0 }]}
      audio={props.audio}
      hide={props.hide}
    >
      {() => null}
    </Command>
  );
}
