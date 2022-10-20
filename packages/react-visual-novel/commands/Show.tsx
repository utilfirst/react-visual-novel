import type {CommandProps} from '../components'
import {Command} from '../components'
import type {ImageViewProps} from './views'
import {ImageView} from './views'

export type ShowSource = Omit<ImageViewProps, 'controls'>

export interface ShowProps
  extends Pick<CommandProps, 'audio' | 'hide' | 'next' | 'zIndex'> {
  src: string | ShowSource | Array<string | ShowSource>
  durationMs?: number
}

export function Show({
  src: srcProp,
  durationMs = 4000,
  audio,
  hide,
  next,
  zIndex,
}: ShowProps) {
  const normalizedSrcs = (Array.isArray(srcProp) ? srcProp : [srcProp]).map(
    (src): ShowSource => (typeof src === 'object' ? src : {uri: src}),
  )
  return (
    <Command
      name="Show"
      behavior={['skippable_timed', {durationMs}]}
      audio={audio}
      hide={hide}
      next={next}
      zIndex={zIndex}
    >
      {(controls) => (
        <>
          {normalizedSrcs.map((src, idx) => (
            <ImageView key={`${src.uri}_${idx}`} controls={controls} {...src} />
          ))}
        </>
      )}
    </Command>
  )
}
