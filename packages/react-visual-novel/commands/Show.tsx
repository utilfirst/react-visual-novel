import type { ImageViewProps } from "#commands/views/ImageView.tsx";
import { ImageView } from "#commands/views/ImageView.tsx";
import type { CommandProps } from "#components/Command.tsx";
import { Command } from "#components/Command.tsx";

export type ShowSource = Omit<ImageViewProps, "controls">;

export type ShowProps = Pick<
  CommandProps,
  "audio" | "hide" | "next" | "zIndex"
> & {
  src: string | ShowSource | (string | ShowSource)[];
  durationMs?: number;
};

export function Show(props: ShowProps) {
  const { src: srcProp } = props;
  const durationMs = props.durationMs ?? 4000;

  const normalizedSrcs = (Array.isArray(srcProp) ? srcProp : [srcProp]).map(
    (src): ShowSource => (typeof src === "object" ? src : { uri: src }),
  );

  return (
    <Command
      name="Show"
      behavior={["skippable_timed", { durationMs }]}
      audio={props.audio}
      hide={props.hide}
      next={props.next}
      zIndex={props.zIndex}
    >
      {(controls) => (
        <>
          {normalizedSrcs.map((src, idx) => (
            // oxlint-disable-next-line react/no-array-index-key -- Repeated image URIs occupy distinct ordered layers, identified by their source position.
            <ImageView key={`${src.uri}_${idx}`} controls={controls} {...src} />
          ))}
        </>
      )}
    </Command>
  );
}
