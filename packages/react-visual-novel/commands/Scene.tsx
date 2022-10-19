import type {CommandAudioConfig, CommandViewAnimation} from '../components'
import {Command} from '../components'
import {ImageView} from './views'

export interface SceneSource {
  uri: string
  style?: React.CSSProperties
  animation?: CommandViewAnimation
}

export interface SceneProps {
  src: string | SceneSource | Array<string | SceneSource>
  audio?: CommandAudioConfig
  durationMs?: number
}

export function Scene({src: srcProp, audio, durationMs = 4000}: SceneProps) {
  const normalizedSrcs = (Array.isArray(srcProp) ? srcProp : [srcProp]).map(
    (src): SceneSource => (typeof src === 'object' ? src : {uri: src}),
  )
  return (
    <Command
      name="Scene"
      behavior={['skippable_timed', {durationMs}]}
      audio={audio}
      hide={(s) => s.command === 'Scene'}>
      {(controls) => (
        <>
          {normalizedSrcs.map((src, idx) => (
            <ImageView
              key={`${src.uri}_${idx}`}
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
              }}
              animation={{
                initial: {opacity: 0},
                entrance: {
                  opacity: 1,
                  transition: {duration: 1},
                },
                exit: {
                  opacity: 0,
                  transition: {delay: 1, duration: 0.5, ease: 'easeOut'},
                },
              }}
              controls={controls}
              {...src}
            />
          ))}
        </>
      )}
    </Command>
  )
}
