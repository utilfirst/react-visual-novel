import type { CommandAudioConfig } from "#components/index.ts";
import { Command } from "#components/index.ts";
import type { Statement } from "#contexts/index.ts";

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
