import { Howl } from "howler";
import { observable } from "micro-observables";
import moize from "moize";
import React from "react";

export function useAudio(src: AudioSource | null) {
  const audioRef = React.useRef<AudioPlayer | null | undefined>(undefined);
  if (audioRef.current === undefined) {
    audioRef.current = src === null ? null : getAudio(src);
  }

  return audioRef.current;
}

export type AudioSource = {
  uri: string;
  channel?: string;
  loop?: boolean;
  overlap?: boolean;
  onStop?: ["fadeOut", number] | ["play", string];
};

export type AudioPlayer = {
  src: AudioSource;
  play: () => Promise<void>;
  stop: () => Promise<void>;
};

// oxlint-disable-next-line typescript/no-unsafe-assignment -- TypeScript 6 accepts the installed Moize declarations, while tsgolint reports an error type here. Preserve the compiler-checked callable signature.
export const getAudio: (source: AudioSource) => AudioPlayer = moize(_getAudio, {
  isDeepEqual: true,
  maxSize: Infinity,
});

function _getAudio(_src: AudioSource): AudioPlayer {
  const playing$ = observable(false);

  let playP = Promise.resolve();
  let stopP = Promise.resolve();

  const src = _src;
  const onStop = src.onStop ?? ["fadeOut", 2000];

  const sound = new Howl({
    src: src.uri,
    loop: src.loop,
    onplayerror: () => {
      sound.once("unlock", () => {
        // `sound.playing()` returns false when sound is blocked
        if (playing$.get() && !sound.playing()) {
          sound.seek(0);
          sound.play();
        }
      });
    },
  });

  const tail = onStop[0] === "play" ? new Howl({ src: onStop[1] }) : null;

  const audio: AudioPlayer = {
    src,
    play: () => {
      if (playing$.get()) {
        return playP;
      }

      playing$.set(true);
      playP = new Promise<void>((resolve) => {
        if (!src.loop) {
          const onEnd = () => {
            playing$.set(false);
            resolve();
            unsub();
          };

          sound.once("end", onEnd);

          const unsub = playing$.subscribe((playing) => {
            if (!playing) {
              resolve();
              unsub();
              sound.off("end", onEnd);
            }
          });
        }

        sound.volume(1);
        sound.seek(0);
        sound.play();
      });
      return playP;
    },
    stop: async () => {
      if (!playing$.get()) {
        return stopP;
      }

      playing$.set(false);
      stopP = new Promise<void>((resolve) => {
        switch (onStop[0]) {
          case "fadeOut": {
            const onFade = () => {
              if (sound.volume() === 0) {
                resolve();
                unsub();
                sound.stop();
              }
            };

            sound.once("fade", onFade);

            const unsub = playing$.subscribe((playing) => {
              if (playing) {
                resolve();
                unsub();
                sound.stop();
                sound.off("fade", onFade);
              }
            });

            sound.fade(1, 0, onStop[1]);
            break;
          }
          case "play": {
            sound.stop();
            if (tail) {
              const onEnd = () => {
                resolve();
                unsub();
              };

              tail.once("end", onEnd);

              const unsub = playing$.subscribe((playing) => {
                if (playing) {
                  resolve();
                  unsub();
                  tail.stop();
                  tail.off("end", onEnd);
                }
              });

              tail.seek(0);
              tail.play();
            } else {
              resolve();
            }

            break;
          }
        }
      });
      return stopP;
    },
  };

  if (src.channel !== undefined && src.channel !== "") {
    const channel = getChannel(src.channel);

    return {
      src,
      play: () => channel.play(audio),
      stop: () => channel.stop(audio),
    };
  }

  return audio;
}

type AudioPlayerMetadata = {
  playedAt: number;
};

type AudioChannel = {
  play: (audio: AudioPlayer) => Promise<void>;
  stop: (audio: AudioPlayer) => Promise<void>;
};

const channels = new Map<string, AudioChannel>();

function getChannel(key: string) {
  const existingChannel = channels.get(key);
  if (existingChannel !== undefined) {
    return existingChannel;
  }

  const channel = makeChannel();
  channels.set(key, channel);
  return channel;
}

function makeChannel(): AudioChannel {
  const playlist = new Map<AudioPlayer, AudioPlayerMetadata>();

  return {
    play: async (audio: AudioPlayer) => {
      if (playlist.has(audio)) {
        playlist.set(audio, { playedAt: Date.now() });
        return;
      }

      const prevAudios = [...playlist.keys()];

      playlist.set(audio, { playedAt: Date.now() });
      await Promise.all(
        prevAudios.map(async (a) => {
          playlist.delete(a);
          if (a.src.overlap) {
            void a.stop().catch((error: unknown) => {
              console.error("Unable to stop overlapping audio", error);
            });
          } else {
            await a.stop();
          }
        }),
      );

      if (!playlist.has(audio)) {
        return;
      }

      return audio.play();
    },
    stop: async (audio: AudioPlayer) => {
      if (!playlist.has(audio)) {
        return;
      }

      // Prevent audio from stopping if it was played recently
      const stoppedAt = Date.now();

      await delay(CHANNEL_DEBOUNCE_INTERVAL_MS);

      if (!playlist.has(audio)) {
        return;
      }

      const metadata = playlist.get(audio);
      if (metadata === undefined || metadata.playedAt > stoppedAt) {
        return;
      }

      playlist.delete(audio);
      return audio.stop();
    },
  };
}

const CHANNEL_DEBOUNCE_INTERVAL_MS = 100;

function delay(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
