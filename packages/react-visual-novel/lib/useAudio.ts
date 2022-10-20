import {Howl} from 'howler'
import {observable} from 'micro-observables'
import moize from 'moize'
import React from 'react'

export function useAudio(src: AudioSource | null) {
  const [audio] = React.useState(() => (src ? getAudio(src) : null))
  return audio
}

export interface AudioSource {
  uri: string
  channel?: string
  loop?: boolean
  overlap?: boolean
  onStop?: ['fadeOut', number] | ['play', string]
}

export interface AudioPlayer {
  src: AudioSource
  play: () => Promise<void>
  stop: () => Promise<void>
}

export const getAudio = moize(_getAudio, {isDeepEqual: true, maxSize: Infinity})

function _getAudio(_src: AudioSource): AudioPlayer {
  const playing$ = observable(false)
  let playP = Promise.resolve()
  let stopP = Promise.resolve()
  const src = typeof _src === 'object' ? _src : {uri: _src}
  const onStop = src.onStop ?? ['fadeOut', 2000]
  const sound = new Howl({
    src: src.uri,
    loop: src.loop,
    onplayerror: () => {
      sound.once('unlock', () => {
        // `sound.playing()` returns false when sound is blocked
        if (playing$.get() && !sound.playing()) {
          sound.seek(0)
          sound.play()
        }
      })
    },
  })
  const tail = onStop[0] === 'play' ? new Howl({src: onStop[1]}) : null
  const audio: AudioPlayer = {
    src,
    play: () => {
      if (playing$.get()) {
        return playP
      }
      playing$.set(true)
      playP = new Promise<void>((resolve) => {
        if (!src.loop) {
          const onEnd = () => {
            console.debug('[useAudio] play :: end', src)
            playing$.set(false)
            resolve()
            unsub()
          }
          sound.once('end', onEnd)
          const unsub = playing$.subscribe((playing) => {
            if (!playing) {
              console.debug('[useAudio] play :: stop', src)
              resolve()
              unsub()
              sound.off('end', onEnd)
            }
          })
        }
        console.debug('[useAudio] play :: start', src)
        sound.volume(1)
        sound.seek(0)
        sound.play()
      })
      return playP
    },
    stop: async () => {
      if (!playing$.get()) {
        return stopP
      }
      playing$.set(false)
      stopP = new Promise<void>((resolve) => {
        switch (onStop[0]) {
          case 'fadeOut': {
            const onFade = () => {
              if (sound.volume() === 0) {
                console.debug('[useAudio] stop :: fade out end', src)
                resolve()
                unsub()
                sound.stop()
              }
            }
            sound.once('fade', onFade)
            const unsub = playing$.subscribe((playing) => {
              if (playing) {
                console.debug('[useAudio] stop :: fade out abort', src)
                resolve()
                unsub()
                sound.stop()
                sound.off('fade', onFade)
              }
            })
            console.debug('[useAudio] stop :: fade out start', src)
            sound.fade(1, 0, onStop[1])
            break
          }
          case 'play':
            sound.stop()
            if (tail) {
              const onEnd = () => {
                console.debug('[useAudio] stop :: tail end', src)
                resolve()
                unsub()
              }
              tail.once('end', onEnd)
              const unsub = playing$.subscribe((playing) => {
                if (playing) {
                  console.debug('[useAudio] stop :: tail abort', src)
                  resolve()
                  unsub()
                  tail.stop()
                  tail.off('end', onEnd)
                }
              })
              console.debug('[useAudio] stop :: tail start', src)
              tail.seek(0)
              tail.play()
            } else {
              resolve()
            }
            break
        }
      })
      return stopP
    },
  }
  if (src.channel) {
    const channel = getChannel(src.channel)
    return {
      src,
      play: () => channel.play(audio),
      stop: () => channel.stop(audio),
    }
  }
  return audio
}

interface AudioPlayerMetadata {
  playedAt: number
}

interface AudioChannel {
  play: (audio: AudioPlayer) => Promise<void>
  stop: (audio: AudioPlayer) => Promise<void>
}

const channels = new Map<string, AudioChannel>()

function getChannel(key: string) {
  if (!channels.has(key)) {
    channels.set(key, makeChannel())
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return channels.get(key)!
}

function makeChannel(): AudioChannel {
  const playlist = new Map<AudioPlayer, AudioPlayerMetadata>()
  return {
    play: async (audio: AudioPlayer) => {
      if (playlist.has(audio)) {
        playlist.set(audio, {playedAt: Date.now()})
        return
      }
      const prevAudios = [...playlist.keys()]
      playlist.set(audio, {playedAt: Date.now()})
      await Promise.all(
        prevAudios.map(async (a) => {
          playlist.delete(a)
          if (a.src.overlap) {
            void a.stop()
          } else {
            await a.stop()
          }
        }),
      )
      if (!playlist.has(audio)) {
        return
      }
      return audio.play()
    },
    stop: async (audio: AudioPlayer) => {
      if (!playlist.has(audio)) {
        return
      }

      // Prevent audio from stopping if it was played recently
      const stoppedAt = Date.now()
      await delay(CHANNEL_DEBOUNCE_INTERVAL_MS)
      if (!playlist.has(audio)) {
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const meta = playlist.get(audio)!
      if (meta.playedAt > stoppedAt) {
        return
      }

      playlist.delete(audio)
      return audio.stop()
    },
  }
}

const CHANNEL_DEBOUNCE_INTERVAL_MS = 100

function delay(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs))
}
