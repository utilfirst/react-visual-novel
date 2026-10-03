import { Howl } from "howler";
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

type AudioPlayingState = {
  isPlaying: boolean;
};

const audioPlayers = new Map<string, AudioPlayer>();
const audioSources = new WeakMap<AudioSource, AudioPlayer>();

export function getAudio(source: AudioSource): AudioPlayer {
  const existingSource = audioSources.get(source);
  if (existingSource !== undefined) {
    return existingSource;
  }

  // NOTE: Source fields contain primitives and one tuple. Sorting fields keeps
  // equivalent configurations cached regardless of property insertion order.
  const key = JSON.stringify(
    Object.entries(source).toSorted(([left], [right]) =>
      left.localeCompare(right),
    ),
  );

  const player = audioPlayers.get(key) ?? _getAudio(source);
  audioPlayers.set(key, player);
  audioSources.set(source, player);
  return player;
}

function _getAudio(_src: AudioSource): AudioPlayer {
  let isPlaying = false;
  const playingListeners = new Set<(playing: boolean) => void>();

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
        if (isPlaying && !sound.playing()) {
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
      if (isPlaying) {
        return playP;
      }

      setPlaying({ isPlaying: true });
      playP = new Promise<void>((resolve) => {
        if (!src.loop) {
          const onEnd = () => {
            setPlaying({ isPlaying: false });
            resolve();
            unsub();
          };

          sound.once("end", onEnd);

          const unsub = subscribeToPlaying((playing) => {
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
      if (!isPlaying) {
        return stopP;
      }

      setPlaying({ isPlaying: false });
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

            const unsub = subscribeToPlaying((playing) => {
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

              const unsub = subscribeToPlaying((playing) => {
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

  function setPlaying(state: AudioPlayingState) {
    if (isPlaying === state.isPlaying) {
      return;
    }

    isPlaying = state.isPlaying;

    // NOTE: A notification may unsubscribe another listener. Notify the
    // listeners present at the transition, matching interruption ordering.
    const listeners = Array.from(playingListeners);
    for (const listener of listeners) {
      listener(state.isPlaying);
    }
  }

  function subscribeToPlaying(listener: (playing: boolean) => void) {
    playingListeners.add(listener);

    return () => {
      playingListeners.delete(listener);
    };
  }
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
