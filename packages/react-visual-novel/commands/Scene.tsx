import { ImageView } from "#commands/views/index.ts";
import type {
  CommandAudioConfig,
  CommandViewAnimation,
} from "#components/index.ts";
import { Command } from "#components/index.ts";
import type { CSSProperties } from "react";

export type SceneSource = {
  uri: string;
  style?: CSSProperties;
  animation?: CommandViewAnimation;
};

export type SceneProps = {
  src: string | SceneSource | (string | SceneSource)[];
  audio?: CommandAudioConfig;
  durationMs?: number;
};

export function Scene(props: SceneProps) {
  const { src: srcProp } = props;
  const durationMs = props.durationMs ?? 4000;

  const normalizedSrcs = (Array.isArray(srcProp) ? srcProp : [srcProp]).map(
    (src): SceneSource => (typeof src === "object" ? src : { uri: src }),
  );

  return (
    <Command
      name="Scene"
      behavior={["skippable_timed", { durationMs }]}
      audio={props.audio}
      hide={(s) => s.command === "Scene"}
    >
      {(controls) => (
        <>
          {normalizedSrcs.map((src, idx) => (
            <ImageView
              // oxlint-disable-next-line react/no-array-index-key -- A scene may repeat one URI on multiple ordered layers. The layer position identifies each image.
              key={`${src.uri}_${idx}`}
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
              }}
              animation={{
                initial: { opacity: 0 },
                entrance: {
                  opacity: 1,
                  transition: { duration: 1 },
                },
                exit: {
                  opacity: 0,
                  transition: { delay: 1, duration: 0.5, ease: "easeOut" },
                },
              }}
              controls={controls}
              {...src}
            />
          ))}
        </>
      )}
    </Command>
  );
}
