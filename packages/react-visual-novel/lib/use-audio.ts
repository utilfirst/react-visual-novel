import { Howl } from "howler";
import { useEffect, useMemo } from "react";

export function useAudio(src: AudioSource | null) {
  const uri = src?.uri;
  const channel = src?.channel;
  const loop = src?.loop;
  const overlap = src?.overlap;

  const fadeOutDuration =
    src?.onStop?.[0] === "fadeOut" ? src.onStop[1] : undefined;

  const tailUri = src?.onStop?.[0] === "play" ? src.onStop[1] : undefined;

  const player = useMemo((): AudioPlayer | null => {
    if (uri === undefined) {
      return null;
    }

    const source: AudioSource = { uri, channel, loop, overlap };
    if (fadeOutDuration !== undefined) {
      source.onStop = ["fadeOut", fadeOutDuration];
    } else if (tailUri !== undefined) {
      source.onStop = ["play", tailUri];
    }

    return makeAudioHandle(source);
  }, [uri, channel, loop, overlap, fadeOutDuration, tailUri]);

  useEffect(() => {
    if (player === null) {
      return undefined;
    }

    // NOTE: Render creates only a source handle. Committed commands retain
    // the shared player, and pending operations retain it through cleanup.
    return getAudio(player.src).retain();
  }, [player]);

  return player;
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

type AudioResource = {
  player: AudioPlayer;
  dispose: () => void;
};

type CachedAudio = {
  player: AudioPlayer;
  retain: () => () => void;
};

const audioPlayers = new Map<string, CachedAudio>();

function makeAudioHandle(source: AudioSource): AudioPlayer {
  const key = getAudioKey(source);

  return {
    src: source,
    play: async () => {
      const cached = getAudio(source);
      const release = cached.retain();
      try {
        await cached.player.play();
      } finally {
        release();
      }
    },
    stop: async () => {
      const cached = audioPlayers.get(key);
      if (cached === undefined) {
        return;
      }

      const release = cached.retain();
      try {
        await cached.player.stop();
      } finally {
        release();
      }
    },
  };
}

function getAudioKey(source: AudioSource) {
  // NOTE: Source fields contain primitives and one tuple. Sorting fields keeps
  // equivalent configurations cached regardless of property insertion order.
  return JSON.stringify(
    Object.entries(source).toSorted(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function getAudio(source: AudioSource): CachedAudio {
  const key = getAudioKey(source);
  const existing = audioPlayers.get(key);
  if (existing !== undefined) {
    return existing;
  }

  let references = 0;

  const resource = makeAudio(source, runOperation);

  const cached: CachedAudio = {
    player: resource.player,
    retain: () => {
      references += 1;

      return () => {
        references -= 1;
        disposeIfUnused();
      };
    },
  };

  audioPlayers.set(key, cached);
  return cached;

  // NOTE: Channel interruption calls a player's stop directly. Track those
  // operations too, so releasing a command cannot unload an unfinished fade.
  async function runOperation(operation: () => Promise<void>) {
    const release = cached.retain();
    try {
      await operation();
    } finally {
      release();
    }
  }

  function disposeIfUnused() {
    if (references !== 0) {
      return;
    }

    audioPlayers.delete(key);
    resource.dispose();
  }
}

function makeAudio(
  src: AudioSource,
  retainOperation: (operation: () => Promise<void>) => Promise<void>,
): AudioResource {
  let isPlaying = false;
  const playingListeners = new Set<(playing: boolean) => void>();
  let loadError: Error | null = null;
  const loadErrorListeners = new Set<(error: Error) => void>();

  let playP = Promise.resolve();
  let stopP = Promise.resolve();

  const onStop = src.onStop ?? ["fadeOut", 2000];

  const sound = new Howl({
    src: src.uri,
    loop: src.loop,
    preload: false,
    onloaderror: (_id, cause) => {
      failLoading(cause);
    },
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

  const tail =
    onStop[0] === "play"
      ? new Howl({
          src: onStop[1],
          preload: false,
          onloaderror: (_id, cause) => {
            failLoading(cause);
          },
        })
      : null;

  const audio: AudioPlayer = {
    src,
    play: () =>
      runOperation(() => {
        if (isPlaying) {
          return playP;
        }

        setPlaying({ isPlaying: true });
        playP = new Promise<void>((resolve) => {
          const onEnd = () => {
            setPlaying({ isPlaying: false });
          };

          if (!src.loop) {
            sound.once("end", onEnd);
          }

          // NOTE: Stopping a loop must settle its pending play operation too.
          const unsub = subscribeToPlaying((playing) => {
            if (!playing) {
              resolve();
              unsub();
              sound.off("end", onEnd);
            }
          });

          if (sound.state() === "unloaded") {
            sound.load();
          }

          sound.volume(1);
          sound.seek(0);
          sound.play();
        });
        return playP;
      }),
    stop: () =>
      runOperation(async () => {
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

                if (tail.state() === "unloaded") {
                  tail.load();
                }

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
      }),
  };

  const channel =
    src.channel !== undefined && src.channel !== ""
      ? getChannel(src.channel)
      : null;

  return {
    player:
      channel === null
        ? audio
        : {
            src,
            play: () => channel.channel.play(audio),
            stop: () => channel.channel.stop(audio),
          },
    dispose: () => {
      sound.unload();
      tail?.unload();
      channel?.release();
    },
  };

  // NOTE: Failed loads cannot emit end or fade. Reject pending operations so
  // their leases release and command callbacks report the failure.
  function runOperation(operation: () => Promise<void>) {
    return retainOperation(async () => {
      if (loadError !== null) {
        throw loadError;
      }

      let rejectFailure: ((error: Error) => void) | undefined;

      const failure = new Promise<void>((_resolve, reject) => {
        rejectFailure = reject;
        loadErrorListeners.add(reject);
      });

      try {
        await Promise.race([operation(), failure]);
      } finally {
        if (rejectFailure !== undefined) {
          loadErrorListeners.delete(rejectFailure);
        }
      }
    });
  }

  function failLoading(cause: unknown) {
    const error = new Error("Unable to load audio", { cause });
    loadError = error;

    for (const listener of Array.from(loadErrorListeners)) {
      listener(error);
    }

    setPlaying({ isPlaying: false });
  }

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
  playId: symbol;
  requestId: symbol;
};

type AudioChannel = {
  play: (audio: AudioPlayer) => Promise<void>;
  stop: (audio: AudioPlayer) => Promise<void>;
};

type CachedChannel = {
  channel: AudioChannel;
  players: number;
};

const channels = new Map<string, CachedChannel>();

function getChannel(key: string) {
  const cached = channels.get(key) ?? { channel: makeChannel(), players: 0 };
  cached.players += 1;
  channels.set(key, cached);

  return {
    channel: cached.channel,
    release: () => {
      cached.players -= 1;
      if (cached.players === 0) {
        channels.delete(key);
      }
    },
  };
}

function makeChannel(): AudioChannel {
  const playlist = new Map<AudioPlayer, AudioPlayerMetadata>();

  return {
    play: async (audio: AudioPlayer) => {
      const currentMetadata = playlist.get(audio);
      if (currentMetadata !== undefined) {
        playlist.set(audio, {
          ...currentMetadata,
          requestId: Symbol("audio request"),
        });
        return;
      }

      const prevAudios = [...playlist.keys()];

      const metadata: AudioPlayerMetadata = {
        playId: Symbol("audio play"),
        requestId: Symbol("audio request"),
      };

      playlist.set(audio, metadata);

      try {
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

        if (playlist.get(audio)?.playId !== metadata.playId) {
          return;
        }

        await audio.play();
      } finally {
        // NOTE: An interrupted play can finish after the same player restarts.
        // Only its own operation may release the channel's current entry.
        if (playlist.get(audio)?.playId === metadata.playId) {
          playlist.delete(audio);
        }
      }
    },
    stop: async (audio: AudioPlayer) => {
      const requestId = playlist.get(audio)?.requestId;
      if (requestId === undefined) {
        return;
      }

      await delay(CHANNEL_DEBOUNCE_INTERVAL_MS);

      // NOTE: Playback renewed during the debounce supersedes this stop.
      // Request identity preserves ordering even within one clock tick.
      if (playlist.get(audio)?.requestId !== requestId) {
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
